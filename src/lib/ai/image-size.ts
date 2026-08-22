import type { AiMessage } from "./chat-history-types";

export type GptImage1kSize = "1024x1024" | "1536x1024" | "1024x1536";

const LANDSCAPE_PATTERN =
  /(?:\blandscape\b|\bhorizontal\b|\bwide(?:screen)?\b|横版|横向|宽屏|16\s*:\s*9|3\s*:\s*2|4\s*:\s*3)/iu;
const PORTRAIT_PATTERN =
  /(?:\bportrait\b|\bvertical\b|\btall\b|竖版|竖向|纵向|手机壁纸|9\s*:\s*16|2\s*:\s*3|3\s*:\s*4)/iu;
const SQUARE_PATTERN = /(?:\bsquare\b|方形|正方形|1\s*:\s*1)/iu;
const DIMENSION_PATTERN = /(\d{3,4})\s*[x×]\s*(\d{3,4})/iu;

function latestUserText(messages: AiMessage[]) {
  const message = messages.findLast((item) => item.role === "user");
  if (!message) return "";

  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join(" ");
}

export function selectGptImage1kSize(messages: AiMessage[]): GptImage1kSize {
  const text = latestUserText(messages);
  const dimensions = DIMENSION_PATTERN.exec(text);
  if (dimensions) {
    const width = Number(dimensions[1]);
    const height = Number(dimensions[2]);
    if (width > height * 1.1) return "1536x1024";
    if (height > width * 1.1) return "1024x1536";
    return "1024x1024";
  }

  if (SQUARE_PATTERN.test(text)) return "1024x1024";
  if (LANDSCAPE_PATTERN.test(text)) return "1536x1024";
  if (PORTRAIT_PATTERN.test(text)) return "1024x1536";
  return "1024x1024";
}
