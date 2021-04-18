const fs = require('fs');
const fetch = require('node-fetch');
const readline = require('readline');
const notifier = require('node-notifier');

const TIMEOUT = 25000; // refresh after 25 sec
const FILE_NAME = 'xbox-timing.txt';

const WEBSITES = [
    {
        url: 'https://www.amazon.in/Xbox-Series-S/dp/B08J89D6BW',
        wordSearch: [
            'Currently unavailable',
            `We don't know when or if this item will be back in stock.`
        ]
    },
    {
        url: 'https://www.flipkart.com/microsoft-xbox-series-s-512-gb/p/itm13c51f9047da8',
        wordSearch: [
            'Sold Out',
            'This item is currently out of stock'
        ]
    }
];


const readGzip = (body, textSearch) => {
    return new Promise(async (resolve, reject) => {
        const lineReader = readline.createInterface({
            input: body
        });
        let bodyString = '';
        lineReader.on('line', (line) => {
            bodyString += line;
        });

        lineReader.on('close', () => {
            resolve(bodyString);
        })
    });
}

/**
 * 
 * @param {string} body 
 * @param {Array<string>} wordsToSearch 
 */

const isProductAvailable = (body, wordsToSearch) => {
    return !wordsToSearch.every(word => body.includes(word));
};

const getUrl = (website) => {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await fetch(website.url, {
                method: 'GET'
            });
            const bodyString = await readGzip(response.body);
            const isAvailable = isProductAvailable(bodyString, website.wordSearch);
            resolve(isAvailable);
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * 
 * @param {Array<string>} urls 
 */
const appendToFile = (urls = []) => {
    return new Promise((resolve, reject) => {
        const xboxUrls = urls.join(',');
        const TEMPLATE = `${new Date().toLocaleString()}: X box series x might be available at ${xboxUrls}\n`;
        fs.appendFile(FILE_NAME, TEMPLATE, (error) => {
            if (!error) {
                notifier.notify({
                    title: 'XBOX ALERT',
                    message: TEMPLATE,
                    sound: true
                });
                resolve();
            }
            reject();
        })
    });
}

const mainJob = (timer) => {
    setTimeout(async () => {
        try {
            const urls = await startJob();
            if (urls.length) {
                await appendToFile(urls);
            }
        } catch (e) {
            console.error("Error printing stuff");
        } finally {
            mainJob(TIMEOUT);
        }
    }, timer);
}

const startJob = async () => {
    try {
        let urls = [];
        for (website of WEBSITES) {
            const result = await getUrl(website);
            if (result) {
                urls.push(website.url);
            }
        }
        return Promise.resolve(urls);
    } catch (e) {
        return Promise.resolve([]);
    }

}


mainJob(0);

