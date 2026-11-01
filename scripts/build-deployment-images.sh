#!/usr/bin/env bash
set -euo pipefail
: "${APP_URL:?Configure APP_URL for this GitHub environment}"
: "${DEPLOY_ENVIRONMENT:?Configure the deployment environment}"
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

export DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/saas_image_test
pnpm db:migrate
runtime_env="$RUNNER_TEMP/image-test.env"
umask 077
cat > "$runtime_env" <<EOF
DATABASE_URL=$DATABASE_URL
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
cleanup() {
  docker rm -f saas-image-web saas-image-worker >/dev/null 2>&1 || true
  rm -f "$runtime_env"
}
trap cleanup EXIT
docker run -d --name saas-image-web --network host --env-file "$runtime_env" "$web_image"
docker run -d --name saas-image-worker --network host --env-file "$runtime_env" "$worker_image"
ready=false
for attempt in {1..30}; do
  if curl -fsS http://127.0.0.1:3000/api/ready && \
     docker logs saas-image-worker 2>&1 | grep -q worker_ready; then
    ready=true
    break
  fi
  sleep 2
done
if [ "$ready" != true ]; then
  docker logs saas-image-web
  docker logs saas-image-worker
  exit 1
fi
for service in saas-image-web saas-image-worker; do
  test "$(docker exec "$service" id -u)" = 1001
  docker exec "$service" node -p process.version
done
printf 'WEB_IMAGE=%s\nWORKER_IMAGE=%s\n' "$web_image" "$worker_image" >> "$GITHUB_ENV"
