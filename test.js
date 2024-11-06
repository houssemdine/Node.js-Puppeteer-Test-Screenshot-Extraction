const puppeteer = require('puppeteer');
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function extractImageAndLink() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

   
    await page.goto('https://www.pascalcoste-shopping.com/esthetique/fond-de-teint.html', {
        waitUntil: 'networkidle2'
    });

    try {
     
        await page.waitForSelector('img.uk-cover', { timeout: 20000 });

       
        const activeData = await page.evaluate(() => {
            const imgElement = document.querySelector('img.uk-cover');
            const dataSource = imgElement ? imgElement.getAttribute('data-source') : null;

         
            const linkElement = document.querySelector('a.uk-position-cover');
            const linkHref = linkElement ? linkElement.href : null;

            return {
                imgDataSource: dataSource,
                linkHref: linkHref || null, 
                format: 'Left Side Banner' 
            };
        });

        if (activeData && activeData.imgDataSource) {
            
            const imageUrl = activeData.imgDataSource;
            const imagePath = path.join(__dirname, 'downloaded_image.png'); 

            
            const writer = fs.createWriteStream(imagePath);
            const response = await axios.get(imageUrl, { responseType: 'stream' });
            response.data.pipe(writer);

            writer.on('finish', () => {
                console.log('Image downloaded successfully');
            });

            
            writer.on('close', () => {
                const adData = {
                    id: crypto.createHash('md5').update(activeData.imgDataSource).digest('hex'), 
                    redirection_url: activeData.linkHref, 
                    img_link: activeData.imgDataSource, 
                    image_url: imagePath, 
                    format: activeData.format
                };

                
                fs.writeFileSync('extracted_image_data.json', JSON.stringify(adData, null, 4));
                console.log('Data extracted and saved to JSON:', adData);
            });
        } else {
            console.error("Image or link not found.");
        }
    } catch (error) {
        console.error("Error while trying to fetch and parse the HTML:", error);
    }

    await browser.close();
}

extractImageAndLink();
