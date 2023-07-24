// Create web server
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
// Create web server
const app = express();
// Enable cross-origin resource sharing
app.use(cors());
// Enable parsing of application/json type post data
app.use(bodyParser.json());
// Enable parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));
// Create comments object
const commentsByPostId = {};
// Create endpoint for GET request
app.get('/posts/:id/comments', (req, res) => {
  res.send(commentsByPostId[req.params.id] || []);
});
// Create endpoint for POST request
app.post('/posts/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  // get comments for post id
  const comments = commentsByPostId[id] || [];
  // create new comment
  const comment = {
    id: Math.random().toString(36).substr(2, 9),
    content,
    status: 'pending',
  };
  // add comment to comments
  comments.push(comment);
  // update commentsByPostId
  commentsByPostId[id] = comments;
  // send event to event bus
  await axios.post('http://event-bus-srv:4005/events', {
    type: 'CommentCreated',
    data: { ...comment, postId: id },
  });
  // send response
  res.status(201).send(comments);
});
// Create endpoint for POST request
app.post('/events', async (req, res) => {
  const { type, data } = req.body;
  console.log(`Event received: ${type}`);
  if (type === 'CommentModerated') {
    const { postId, id, status, content } = data;
    // get comments for post id
    const comments = commentsByPostId[postId];
    // find comment with id
    const comment = comments.find((c) => c.id === id);
    // update comment status
    comment.status = status;
    // send event to event bus
    await axios.post('http://event-bus-srv:4005/events', {
      type: 'CommentUpdated',
      data: { ...comment, postId },
    });
  }
  res.send({});
});
//


