import { JSDOM } from "jsdom";

export function getDocument(text: any): Document {
    return new JSDOM(text).window.document
}