const express = require('express');
const cors = require('cors');
const { sendOfferEmail } = require('./sendOfferEmail');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/send-offer-alert', async (req, res) => {
  try {
    const { to, subject, text } = req.body;

    if (!to || !subject || !text) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    await sendOfferEmail(to, subject, text);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Offer mail server running on port ${port}`);
});
