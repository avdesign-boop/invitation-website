export function describeBrowser(userAgent: string | null | undefined): string {
  if (!userAgent) {
    return "Unknown browser";
  }
  let browser = "Browser";
  if (/Edg\//.test(userAgent)) {
    browser = "Edge";
  } else if (/OPR\//.test(userAgent)) {
    browser = "Opera";
  } else if (/Chrome\//.test(userAgent) || /CriOS\//.test(userAgent)) {
    browser = "Chrome";
  } else if (/Firefox\//.test(userAgent) || /FxiOS\//.test(userAgent)) {
    browser = "Firefox";
  } else if (/Safari\//.test(userAgent)) {
    browser = "Safari";
  }
  let system = "an unknown system";
  if (/Android/.test(userAgent)) {
    system = "Android";
  } else if (/iPhone|iPad|iPod/.test(userAgent)) {
    system = "iOS";
  } else if (/Windows/.test(userAgent)) {
    system = "Windows";
  } else if (/Mac OS X|Macintosh/.test(userAgent)) {
    system = "macOS";
  } else if (/Linux/.test(userAgent)) {
    system = "Linux";
  }
  return `${browser} on ${system}`;
}
