export function getCookie(header: any): string[] {
  return header['set-cookie'] as string[]
}
