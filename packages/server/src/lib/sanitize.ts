/**
 * Basic HTML entity escaping for user-generated content.
 * Prevents XSS when content is rendered in responses.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Mask a phone number for logging: +972521234567 → +972***4567
 */
export function maskPhone(phone: string): string {
  return phone.replace(/(\+?\d{3})\d+(\d{4})/, "$1***$2");
}
