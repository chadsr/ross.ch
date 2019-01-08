import to from 'await-to-js';
import axios, { AxiosResponse } from 'axios';

import { logger } from './logging';
import { MediumFeed, MediumPost } from './interfaces';

const MEDIUM_URL = 'https://medium.com/';

export async function getFeed(username: string, numberPosts: number): Promise<MediumFeed> {
  const mediumFeed: MediumFeed = {
    posts: []
  };

  const [err, res] = await to(axios.get(`${MEDIUM_URL}${username}/latest?format=json`));
  if (err) {
    logger.error('Could not get Medium feed:', err);
    return;
  }

  // Parse the response data to an object, feedObj
  const data = res.data.substr(res.data.indexOf('{')); // Remove initial invalid JSON
  const feedObj = <Object>JSON.parse(data);
  if (!feedObj['success']) {
    logger.error('Medium API responded with failure!');
    return;
  }

  // Extract the posts object to postsObj
  const postsObj = <Object>feedObj['payload']['references']['Post'];

  for (const obj of Object.values(postsObj)) {
    // Extract post tags
    const tags: string[] = [];
    obj['virtuals']['tags'].forEach(tagObj => {
      tags.push(tagObj['name']);
    });

    // Format a date string from milisecond epoch value
    const msEpoch = obj['firstPublishedAt'];
    const publishDate = new Date(msEpoch);
    const dateString = publishDate.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    // Populate our MediumPost object
    const mediumPost = <MediumPost> {
      title: obj['title'],
      url: `${MEDIUM_URL}s/story/${obj['uniqueSlug']}`,
      publishDate: dateString,
      contentSnippet: obj['content']['subtitle'],
      tags: tags
    };

    // Add the medium post to our MediumFeed object
    mediumFeed.posts.push(mediumPost);

    if (mediumFeed.posts.length == numberPosts) {
      break;
    }
  }

  return mediumFeed;
}