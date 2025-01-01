const express = require('express');
const axios = require('axios');
const cheerio = require("cheerio");
const app = express();
const PORT = process.env.PORT || 3000;
const yts = require('yt-search');

// Endpoint to fetch GitHub user data using query parameter
app.get('/api/githubstalk', async (req, res) => {
    const user = req.query.q;

    if (!user) {
        return res.status(400).json({ error: 'Query parameter "q" is required.' });
    }

    try {
        const { data } = await axios.get(`https://api.github.com/users/${user}`);
        const result = {
            username: data.login,
            nickname: data.name,
            bio: data.bio,
            id: data.id,
            nodeId: data.node_id,
            profile_pic: data.avatar_url,
            url: data.html_url,
            type: data.type,
            admin: data.site_admin,
            company: data.company,
            blog: data.blog,
            location: data.location,
            email: data.email,
            public_repo: data.public_repos,
            public_gists: data.public_gists,
            followers: data.followers,
            following: data.following,
            created_at: data.created_at,
            updated_at: data.updated_at
        };
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data from GitHub.' });
    }
});



async function npmstalk(packageName) {
  let stalk = await axios.get("https://registry.npmjs.org/" + packageName);
  let versions = stalk.data.versions;
  let allver = Object.keys(versions);
  let verLatest = allver[allver.length - 1];
  let verPublish = allver[0];
  let packageLatest = versions[verLatest];
  
  return {
    name: packageName,
    versionLatest: verLatest,
    versionPublish: verPublish,
    versionUpdate: allver.length,
    latestDependencies: Object.keys(packageLatest.dependencies || {}).length,
    publishDependencies: Object.keys(versions[verPublish].dependencies || {}).length,
    publishTime: stalk.data.time.created,
    latestPublishTime: stalk.data.time[verLatest],
  };
}

// API endpoint to get package details with a query parameter
app.get('/api/npmstalk', async (req, res) => {
  const { q: packageName } = req.query; // Extract 'q' from query parameters

  if (!packageName) {
    return res.status(400).json({
      success: false,
      message: "Query parameter 'q' is required",
    });
  }

  try {
    const packageDetails = await npmstalk(packageName);
    res.json({
      success: true,
      data: packageDetails,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch package details',
      error: error.message,
    });
  }
});
app.get('/api/ringtones', async (req, res) => {
    const { title } = req.query;

    if (!title) {
        return res.status(400).json({ error: 'Please provide a title query parameter' });
    }

    try {
        const ringtones = await fetchRingtones(title); // Call the fetch function
        res.json(ringtones);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching ringtones', details: error.message });
    }
});

// Function to fetch ringtones
async function fetchRingtones(title) {
    try {
        const response = await axios.get('https://meloboom.com/en/search/' + title);
        const $ = cheerio.load(response.data);
        const results = [];
        $('#__next > main > section > div.jsx-2244708474.container > div > div > div > div:nth-child(4) > div > div > div > ul > li').each((a, b) => {
            results.push({
                title: $(b).find('h4').text(),
                source: 'https://meloboom.com/' + $(b).find('a').attr('href'),
                audio: $(b).find('audio').attr('src'),
            });
        });
        return results;
    } catch (error) {
        throw error;
    }
}

const ttsave = {
    download: async (url) => {
        const apiUrl = 'https://ttsave.app/download';
        const headers = {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Android 10; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
            'Referer': 'https://ttsave.app/id'
        };

        const data = {
            query: url,
            language_id: "2"
        };

        try {
            const response = await axios.post(apiUrl, data, { headers });
            const html = response.data;
            const result = ttsave.extract(html);
            return result;
        } catch (error) {
            console.error('Error downloading video:', error);
            throw error;
        }
    },
    extract: (html) => {
        const $ = cheerio.load(html);
        const result = {};

        result.uniqueId = $('#unique-id').val();
        result.username = $('h2.font-extrabold').text().trim();
        result.userHandle = $('a[title]').text().trim();
        result.userProfileImage = $('img').attr('src');
        result.description = $('p.oneliner').text().trim();
        result.views = $('span:contains("K")').first().text().trim();

        result.downloadLinks = {
            noWatermark: $('a[type="no-watermark"]').attr('href'),
            withWatermark: $('a[type="watermark"]').attr('href'),
            audio: $('a[type="audio"]').attr('href'),
            profileImage: $('a[type="profile"]').attr('href'),
            coverImage: $('a[type="cover"]').attr('href')
        };

        return result;
    }
};

// Define the API endpoint
app.get('/api/tiktok', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'Please provide a URL in the query parameter.' });
    }

    try {
        const result = await ttsave.download(url);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch video details.',
            details: error.message
        });
    }
});
async function fetchTikTokUserData(username) {
    const url = `https://countik.com/tiktok-analytics/user/@${username}`;
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(data);
        const userData = {
            username: $('.username h2').text().trim(),
            nickname: $('.nickname').text().trim(),
            country: $('.acc-country').text().trim(),
            profilePicture: $('.pic img').attr('src'),
            profileUrl: $('.visit-btn a').attr('href'),
            stats: {
                totalFollowers: $('.user-stats .block:nth-child(1) p').text().trim(),
                totalLikes: $('.user-stats .block:nth-child(2) p').text().trim(),
                totalVideos: $('.user-stats .block:nth-child(3) p').text().trim(),
                following: $('.user-stats .block:nth-child(4) p').text().trim()
            },
            engagementRates: {
                overallEngagement: $('.total-engagement-rates .block:nth-child(1) p').text().trim(),
                likesRate: $('.total-engagement-rates .block:nth-child(2) p').text().trim(),
                commentsRate: $('.total-engagement-rates .block:nth-child(4) p').text().trim(),
                sharesRate: $('.total-engagement-rates .block:nth-child(3) p').text().trim()
            },
            averageVideoPerformance: {
                avgViews: $('.average-video-performance .block:nth-child(1) p').text().trim(),
                avgLikes: $('.average-video-performance .block:nth-child(2) p').text().trim(),
                avgComments: $('.average-video-performance .block:nth-child(3) p').text().trim(),
                avgShares: $('.average-video-performance .block:nth-child(4) p').text().trim()
            },
            hashtags: $('.hashtags .item:nth-child(1) .mem').map((_, el) => $(el).text().trim()).get(),
            mostUsedHashtags: $('.hashtags .item:nth-child(2) .span-tag').map((_, el) => ({
                hashtag: $(el).find('.chosen').text().trim(),
                count: $(el).find('.count').text().trim()
            })).get(),
            recentPosts: $('.recent-posts .item').map((_, post) => ({
                image: $(post).find('.post-img img').attr('src'),
                views: $(post).find('.post-data .data:nth-child(1) .value').text().trim(),
                likes: $(post).find('.post-data .data:nth-child(2) .value').text().trim(),
                comments: $(post).find('.post-data .data:nth-child(3) .value').text().trim(),
                shares: $(post).find('.post-data .data:nth-child(4) .value').text().trim(),
                hashtagsCount: $(post).find('.post-data .data:nth-child(5) .value').text().trim(),
                mentions: $(post).find('.post-data .data:nth-child(6) .value').text().trim(),
                saves: $(post).find('.post-data .data:nth-child(7) .value').text().trim(),
                engagementRate: $(post).find('.post-data .medium-engagement .value').text().trim(),
                description: $(post).find('.post-data .desc').text().trim(),
                music: {
                    title: $(post).find('.music-details a').text().trim(),
                    audioUrl: $(post).find('.music-info audio source').attr('src')
                },
                createdTime: $(post).find('.extra-data .create-time p').text().trim()
            })).get()
        };

        return userData;
    } catch (error) {
        console.error('Error fetching TikTok user data:', error.message);
        throw new Error('Unable to fetch TikTok user data.');
    }
}

// API endpoint
app.get('/api/tiktok/user', async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ error: 'Please provide a username in the query parameter.' });
    }

    try {
        const userData = await fetchTikTokUserData(username);
        res.json(userData);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch TikTok user data.',
            details: error.message
        });
    }
});
app.get('/anime-status1', async (req, res) => {
  try {
    const url = "https://shortstatusvideos.com/anime-video-status-download/";
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    const videos = [];

    $("a.mks_button.mks_button_small.squared").each((index, element) => {
      const link = $(element).attr("href");
      const title = $(element).closest("p").prevAll("p").find("strong").text();
      videos.push({ title, link });
    });

    const randomIndex = Math.floor(Math.random() * videos.length);
    const randomVideo = videos[randomIndex];

    res.json({ success: true, video: randomVideo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route to get anime video status from the second source
app.get('/anime-status2', async (req, res) => {
  try {
    const url = "https://mobstatus.com/anime-whatsapp-status-video/";
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    const videos = [];
    const title = $("strong").first().text();

    $("a.mb-button.mb-style-glass.mb-size-tiny.mb-corners-pill.mb-text-style-heavy").each((index, element) => {
      const link = $(element).attr("href");
      videos.push({ title, link });
    });

    const randomIndex = Math.floor(Math.random() * videos.length);
    const randomVideo = videos[randomIndex];

    res.json({ success: true, video: randomVideo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
async function cocofun(url) {
  return new Promise((resolve, reject) => {
    axios({
      url,
      method: "get",
      headers: {
        Cookie: "client_id=1a5afdcd-5574-4cfd-b43b-b30ad14c230e",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36"
      }
    })
    .then((response) => {
      const $ = cheerio.load(response.data);
      let appState;
      const scriptAppState = $("script#appState").get();
      for (let script of scriptAppState) {
        if (script.children && script.children[0] && script.children[0].data) {
          const appStateString = script.children[0].data.split("window.APP_INITIAL_STATE=")[1];
          appState = JSON.parse(appStateString);
        }
      }
      const result = {
        status: 200,
        topic: appState.share.post.post.content || appState.share.post.post.topic.topic,
        caption: $("meta[property='og:description']").attr("content"),
        play: appState.share.post.post.playCount,
        like: appState.share.post.post.likes,
        share: appState.share.post.post.share,
        duration: appState.share.post.post.videos[appState.share.post.post.imgs[0].id].dur,
        thumbnail: appState.share.post.post.videos[appState.share.post.post.imgs[0].id].coverUrls[0],
        watermark: appState.share.post.post.videos[appState.share.post.post.imgs[0].id].urlwm,
        no_watermark: appState.share.post.post.videos[appState.share.post.post.imgs[0].id].url
      };
      resolve(result);
    })
    .catch((error) => {
      reject(error);
    });
  });
}

// API endpoint
app.get('/api/cocofun', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    const data = await cocofun(url);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch data', details: error.message });
  }
});
async function ffstalk(id) {
  try {
    const response = await axios.get('https://allstars-apis.vercel.app/freefire?id=' + id);
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to fetch data from the Free Fire API');
  }
}

// API Endpoint
app.get('/api/ffstalk', async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID parameter is required' });
  }

  try {
    const data = await ffstalk(id);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
async function film(query) {
    try {
        let { data } = await axios.get('https://ruangmoviez.my.id/?s=' + query);
        let $ = cheerio.load(data);
        const movies = [];

        $('article.item-infinite').each((index, element) => {
            const movie = {};
            movie.link = $(element).find('a[itemprop="url"]').attr('href');
            movie.title = $(element).find('h2.entry-title a').text();
            movie.relTag = $(element).find('a[rel="category tag"]').map((i, el) => $(el).text()).get();
            movies.push(movie);
        });

        return {
            status: 200,
            creator: '@michelle.js - Claires',
            result: movies
        };
    } catch (e) {
        return {
            status: 404,
            msg: e.message
        };
    }
}

// API Endpoint
app.get('/api/film', async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
        const data = await film(query);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch movie data', details: error.message });
    }
});
const formatAudio = ['mp3', 'm4a', 'webm', 'acc', 'flac', 'opus', 'ogg', 'wav'];
const formatVideo = ['360', '480', '720', '1080', '1440', '4k'];

const ytdlScraper = {
    download: async (url, format) => {
        if (!formatAudio.includes(format) && !formatVideo.includes(format)) {
            throw new Error('Unsupported format. Please check the supported list.');
        }

        const config = {
            method: 'GET',
            url: `https://p.oceansaver.in/ajax/download.php?format=${format}&url=${encodeURIComponent(url)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        };

        try {
            const response = await axios.request(config);

            if (response.data && response.data.success) {
                const { id, title, info } = response.data;
                const { image } = info;
                const downloadUrl = await ytdlScraper.checkProgress(id);

                return {
                    id: id,
                    image: image,
                    title: title,
                    downloadUrl: downloadUrl
                };
            } else {
                throw new Error('Failed to fetch video details.');
            }
        } catch (error) {
            console.error('Error:', error.message);
            throw error;
        }
    },
    checkProgress: async (id) => {
        const config = {
            method: 'GET',
            url: `https://p.oceansaver.in/ajax/progress.php?id=${id}`,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        };

        try {
            while (true) {
                const response = await axios.request(config);

                if (response.data && response.data.success && response.data.progress === 1000) {
                    return response.data.download_url;
                }
                await new Promise(resolve => setTimeout(resolve, 5000)); // Polling every 5 seconds
            }
        } catch (error) {
            console.error('Error:', error.message);
            throw error;
        }
    }
};

// API Route for downloading video/audio
app.get('/ytdl', async (req, res) => {
    const { url, format } = req.query;

    if (!url || !format) {
        return res.status(400).json({ error: 'Missing required query parameters: url and format.' });
    }

    try {
        const result = await ytdlScraper.download(url, format);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

const ytdlScraper = {
    download: async (url, format) => {
        if (!formatAudio.includes(format) && !formatVideo.includes(format)) {
            throw new Error('Unsupported format. Please check the supported list.');
        }

        const config = {
            method: 'GET',
            url: `https://p.oceansaver.in/ajax/download.php?format=${format}&url=${encodeURIComponent(url)}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        };

        try {
            const response = await axios.request(config);

            if (response.data && response.data.success) {
                const { id, title, info } = response.data;
                const { image } = info;
                const downloadUrl = await ytdlScraper.checkProgress(id);

                return {
                    id: id,
                    image: image,
                    title: title,
                    downloadUrl: downloadUrl
                };
            } else {
                throw new Error('Failed to fetch video details.');
            }
        } catch (error) {
            console.error('Error:', error.message);
            throw error;
        }
    },
    checkProgress: async (id) => {
        const config = {
            method: 'GET',
            url: `https://p.oceansaver.in/ajax/progress.php?id=${id}`,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        };

        try {
            while (true) {
                const response = await axios.request(config);

                if (response.data && response.data.success && response.data.progress === 1000) {
                    return response.data.download_url;
                }
                await new Promise(resolve => setTimeout(resolve, 5000)); // Polling every 5 seconds
            }
        } catch (error) {
            console.error('Error:', error.message);
            throw error;
        }
    }
};

// API Route for downloading video/audio using query
app.get('/ytdl2', async (req, res) => {
    const { query, format } = req.query;

    if (!query || !format) {
        return res.status(400).json({ error: 'Missing required query parameters: query and format.' });
    }

    try {
        // Use yt-search to get the first video result
        const searchResults = await yts(query);
        if (!searchResults.videos.length) {
            return res.status(404).json({ error: 'No videos found for the given query.' });
        }

        const video = searchResults.videos[0]; // Take the first result
        const videoUrl = video.url;

        // Use the video URL to fetch the download link
        const result = await ytdlScraper.download(videoUrl, format);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
