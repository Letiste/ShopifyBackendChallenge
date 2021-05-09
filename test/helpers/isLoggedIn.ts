export function isLoggedIn(header: object): boolean {
  const token: string = header['set-cookie'][0].split(';')[0]
  return token.startsWith('remember_web')
}
