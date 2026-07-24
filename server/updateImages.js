require('dotenv').config();
const mongoose = require('mongoose');

const imageMap = {
  "Almonds": "https://i1-c.pinimg.com/1200x/6f/55/82/6f558209bca8c009629e9ebb40fa8633.jpg",
  "Cashew": "https://i1-c.pinimg.com/1200x/1e/e9/29/1ee9291e3ad643e80e08b03112e2d3c9.jpg",
  "Pistachio": "https://i1-c.pinimg.com/736x/14/92/75/149275669c5e1822264c94ec1920d694.jpg",
  "Dates": "https://i.pinimg.com/736x/a9/a6/e1/a9a6e1d15fe059fe44d216ae97c383ec.jpg",
  "Walnuts": "https://i.pinimg.com/736x/66/7d/d2/667dd27b774d8f7b6a6757a89cf83530.jpg",
  "Dry Mangoes": "https://i.pinimg.com/736x/e6/67/5e/e6675e4c102e8b997f453732135011be.jpg",
  "Dry Apricots": "https://i.pinimg.com/736x/cd/0d/27/cd0d27f24c8d4ca872a337d998b1b904.jpg",
  "Dry Kiwi": "https://i.pinimg.com/736x/0c/44/4b/0c444b2fa3841e5d125085bac2db7891.jpg",
  "Raisins": "https://i1-c.pinimg.com/1200x/c5/9f/30/c59f301e2423b6ba3d917a9707ff413c.jpg"
};

async function updateImages() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const Product = require('./models/Product');

  for (const [name, imageUrl] of Object.entries(imageMap)) {
    const result = await Product.updateOne({ name }, { $set: { image: imageUrl } });
    console.log(`${name}: matched=${result.matchedCount}, modified=${result.modifiedCount}`);
  }

  console.log('Done!');
  process.exit(0);
}

updateImages().catch(err => {
  console.error(err);
  process.exit(1);
});