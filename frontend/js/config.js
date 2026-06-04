const apiURL = 'https://quinielamx.onrender.com';

async function fetchWithRetry(url, options = {}) {
    for (let attempt = 1; attempt <= 3; attempt++) {
        const res = await fetch(url, options);
        if (res.status !== 429 || attempt === 3) return res;
        await new Promise(r => setTimeout(r, 1000 * attempt));
    }
}
