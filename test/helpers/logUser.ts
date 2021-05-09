import supertest from "supertest"
import { getCookie } from "./getCookie"

const BASE_URL = `http://${process.env.HOST}:${process.env.PORT}`
const request = supertest(BASE_URL)


/**
 * Given a valid username and a valid password,
 * log in the user and return the cookies to
 * authenticate further requests
 */
export async function logUser(username: string, password: string): Promise<string[]> {
    const { header } = await request
        .post('/login')
        .send({ username, password })
    return getCookie(header)
}