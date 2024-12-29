const express = require('express');
const axios = require('axios');
const cheerio = require("cheerio");
const app = express();
const PORT = process.env.PORT || 3000;

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


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
