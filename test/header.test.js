const puppeteer = require("puppeteer");

let browser, page;

beforeEach( async ()=>{
    browser = await puppeteer.launch()
    page = await browser.newPage()
    await page.goto('localhost:3000')
})

afterEach( async () =>{
    await browser.close()
})

test("The header has correct header", async () => {
    const text = await page.$eval('a.brand-logo', el => el.innerHTML)
    expect(text).toEqual("Blogster")
})

test("The header has correct OAuth flow", async () => {
    await page.click('.right a')
   const url  = page.url();
   expect(url).toMatch(/accounts\.google\.com/)
})