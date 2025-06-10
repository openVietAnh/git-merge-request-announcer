const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

app.post('/gitlab-webhook', async (req, res) => {
  const event = req.header('X-Gitlab-Event');

  if (event !== 'Merge Request Hook') {
    return res.status(200).send('Ignoring non-MR event');
  }

  const mr = req.body.object_attributes;
  const reviewers = req.body.reviewers || [];
  const assignee = req.body.assignee;

  const reviewerMentions = reviewers.map(r => `<@${r.username}>`).join(' ') || '_None_';
  const assigneeMention = assignee ? `<@${assignee.username}>` : '_None_';

  const slackMessage = {
    text: `:gitlab: *New Merge Request Created!*\n*Title:* ${mr.title}\n*Link:* ${mr.url}\n*Reviewers:* ${reviewerMentions}\n*Assignee:* ${assigneeMention}\n\nPlease review this MR. :eyes:`,
  };

  try {
    await axios.post(SLACK_WEBHOOK_URL, slackMessage);
    res.status(200).send('OK');
  } catch (err) {
    console.error('Error sending to Slack:', err.message);
    res.status(500).send('Failed to send to Slack');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook listener running on port ${PORT}`);
});