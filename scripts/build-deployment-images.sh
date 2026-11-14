#!/usr/bin/env bash
set -euo pipefail
: "${APP_URL:?Configure APP_URL for this GitHub environment}"
: "${DEPLOY_ENVIRONMENT:?Configure the deployment environment}"
: "${IMAGE_TEST_POSTGRES_PORT:?Provide the published PostgreSQL port}"
: "${IMAGE_TEST_NETWORK:?Provide the PostgreSQL service network}"
image_root="ghcr.io/${GITHUB_REPOSITORY,,}"
image_tag="$DEPLOY_ENVIRONMENT-sha-$GITHUB_SHA"
web_image="$image_root:$image_tag"
worker_image="$image_root-worker:$image_tag"
args=(--build-arg "NEXT_PUBLIC_APP_URL=$APP_URL")
for key in NEXT_PUBLIC_UMAMI_SCRIPT_URL NEXT_PUBLIC_UMAMI_WEBSITE_ID NEXT_PUBLIC_UMAMI_DOMAINS; do
  args+=(--build-arg "$key=${!key:-}")
done
docker build -f docker/Dockerfile --target runner "${args[@]}" \
  --label "org.opencontainers.image.source=https://github.com/$GITHUB_REPOSITORY" \
  --label "org.opencontainers.image.revision=$GITHUB_SHA" -t "$web_image" .
# The second target reuses the completed builder and runtime layers.
docker build -f docker/Dockerfile --target worker "${args[@]}" \
  --label "org.opencontainers.image.source=https://github.com/$GITHUB_REPOSITORY" \
  --label "org.opencontainers.image.revision=$GITHUB_SHA" -t "$worker_image" .

database_url="postgresql://postgres:postgres@127.0.0.1:$IMAGE_TEST_POSTGRES_PORT/saas_image_test"
DATABASE_URL="$database_url" JOB_DATABASE_URL="$database_url" pnpm db:migrate

umask 077
smoke_dir="$(mktemp -d "${RUNNER_TEMP:?Provide the runner temp directory}/saas-image-test.XXXXXXXX")"
runtime_env="$smoke_dir/runtime.env"
web_id=
worker_id=
cleanup() {
  for container in "$web_id" "$worker_id"; do
    if [ -n "$container" ]; then
      docker rm -fv "$container" >/dev/null || true
    fi
  done
  rm -f "$runtime_env"
  rmdir "$smoke_dir"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
cat > "$runtime_env" <<EOF
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/saas_image_test
NEXT_PUBLIC_APP_URL=$APP_URL
BETTER_AUTH_SECRET=image-test-secret-at-least-32-characters
RESEND_API_KEY=re_image_test
RESEND_EMAIL_FROM=noreply@example.com
R2_ENDPOINT=https://example.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=image-test
R2_SECRET_ACCESS_KEY=image-test
R2_BUCKET_NAME=image-test
UPLOAD_CLEANUP_SECRET=image-test-upload-cleanup-at-least-32-characters
STRIPE_SECRET_KEY=sk_test_image_test
STRIPE_ENVIRONMENT=test_mode
STRIPE_WEBHOOK_SECRET=whsec_image_test
LLM_API_KEY=image-test
HOSTNAME=0.0.0.0
PORT=3000
EOF
web_id="$(docker create --name "${smoke_dir##*/}-web" --network "$IMAGE_TEST_NETWORK" \
  --publish 127.0.0.1::3000 --env-file "$runtime_env" "$web_image")"
worker_id="$(docker create --name "${smoke_dir##*/}-worker" --network "$IMAGE_TEST_NETWORK" \
  --env-file "$runtime_env" "$worker_image")"
docker start "$web_id" "$worker_id" >/dev/null
web_address="$(docker port "$web_id" 3000/tcp)"
[[ "$web_address" =~ ^127\.0\.0\.1:[0-9]+$ ]]
ready=false
for attempt in {1..30}; do
  if curl -fsS --max-time 3 "http://$web_address/api/ready" && \
     docker logs "$worker_id" 2>&1 | grep -F '"event":"worker_ready"' >/dev/null; then
    ready=true
    break
  fi
  sleep 2
done
if [ "$ready" != true ]; then
  docker logs "$web_id"
  docker logs "$worker_id"
  exit 1
fi
for service in "$web_id" "$worker_id"; do
  test "$(docker exec "$service" id -u)" = 1001
  docker exec "$service" node -p process.version
done
printf 'WEB_IMAGE=%s\nWORKER_IMAGE=%s\n' "$web_image" "$worker_image" >> "$GITHUB_ENV"
