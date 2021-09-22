const puppeteer = require('puppeteer');

const instagramUrl = 'https://www.instagram.com/';

// specify USERNAME and PASSWORD as environment variables before running this script.
const username = process.env.USERNAME;
const password = process.env.PASSWORD;

console.log(`username: ${username}\npassword: ${password}`);

async function pressDelete(page) {

  /* 
  This function iterates all the buttons available and clicks which one who's text is 'Delete'.
  */
  const buttonsOnPage = await page.$$('button');
  const buttonsText = await page.$$eval('button', els => {return els.map(el =>  el.innerText)})

  for (let i = 0; i < buttonsText.length; i ++){
      if (buttonsText[i] == 'Delete') {
          await buttonsOnPage[i].click()
        }
    }
}

async function loginToInstagram(page){
    /* 
    This function hanldes the Login flow for the instagram profile
    wished to be cleaned of posts.
    */
    await page.goto(instagramUrl);
    await page.waitForSelector('input');

    // set the username and password input bars
    let inputElements = await page.$$('input')
    await inputElements[0].focus();
    await page.keyboard.type(username);
    await inputElements[1].focus();
    await page.keyboard.type(password);
    await page.click('button[type="submit"]');

    await page.waitForSelector('.logged-in');

}

async function deleteLastImage(page){
    /* 
    This function deletes the latest post on the IG profile given.
    when using this function, page should be on the profile page. */

    // click on a post
    const imageSelector = '#react-root article div a div';
    console.log("waiting for image selector...")
    await page.waitForSelector(imageSelector);
    await page.click(imageSelector);

    // wait for the post to load
    console.log('waiting for image load');
    await page.waitForResponse(response => {
        return response.request().resourceType() === 'image';
      });

    // click on the post's options button
    const optionSelector = 'article button';
    console.log("waiting for option selector...");
    await page.waitForSelector(optionSelector);
    await page.$eval(optionSelector, el=> el.click())
    await page.$$eval(optionSelector, els => {
        els = els.slice(0, 2);
        if (els[0].innerText === 'Toggle audio') {els[1].click()}
        else {els[0].click()}
    })


    // wait for a dialog with 7 buttons to appear
    console.log('waiting for 7 button dialog');
    await page.waitForFunction(() => document.querySelectorAll('[role="presentation"] [role="dialog"] button').length > 5)
    console.log("pressing delete first....")
    await pressDelete(page);

    // wait for a dialog with 2 buttons to appear
      console.log('waiting for 2 button dialog...');
    await page.waitForFunction(() => document.querySelectorAll('[role="presentation"] [role="dialog"] button').length === 2)
    console.log("pressing delete second...")
    await pressDelete(page);

    console.log('deleted!')

}

(async () => {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  
  // Log in to instagram with the credentials provided as environment variables
  await loginToInstagram(page);
  console.log('logged in!')
  await page.goto(`${instagramUrl}${username}`)

  // count total posts
  let numOfPosts = parseInt((await page.$eval('header section ul li span', el => el.innerText)).split(" ")[0])
  
  for (let i = 0; i < numOfPosts; i ++){
    console.log(`${numOfPosts - i} posts left...`)
    // delete the last (latest) image in the profile
    await deleteLastImage(page);
    console.log("waiting for response...")
    await page.waitForResponse(`${instagramUrl}${username}/?__a=1`)
  }

  await browser.close();
})();