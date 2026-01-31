const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/comspace';

const run = async () => {
  await mongoose.connect(MONGODB_URI);

  console.log('Connected to MongoDB, seeding sample data...');

  const userSchema = new mongoose.Schema({ email: String, password: String, firstName: String, lastName: String, role: String }, { timestamps: true });
  const productSchema = new mongoose.Schema({ title: String, description: String, price: Number, createdBy: mongoose.Schema.Types.ObjectId }, { timestamps: true });
  const categorySchema = new mongoose.Schema({ name: String }, { timestamps: true });
  const storeSchema = new mongoose.Schema({ name: String, owner: mongoose.Schema.Types.ObjectId }, { timestamps: true });

  const User = mongoose.model('UserSample', userSchema, 'users');
  const Product = mongoose.model('ProductSample', productSchema, 'products');
  const Category = mongoose.model('CategorySample', categorySchema, 'categories');
  const Store = mongoose.model('StoreSample', storeSchema, 'stores');

  // Clean sample collections (non-destructive to other data)
  await User.deleteMany({ email: /@example.com$/ });
  await Product.deleteMany({ title: /Sample Product/ });
  await Category.deleteMany({ name: /Sample/ });
  await Store.deleteMany({ name: /Sample Store/ });

  const user = await User.create({ email: 'owner@example.com', password: 'Password123!', firstName: 'Owner', lastName: 'Example', role: 'owner' });
  const store = await Store.create({ name: 'Sample Store', owner: user._id });
  const cat = await Category.create({ name: 'Sample Category' });

  const products = [];
  for (let i = 1; i <= 5; i++) {
    products.push({ title: `Sample Product ${i}`, description: 'A great sample product', price: 9.99 + i, createdBy: user._id });
  }

  await Product.insertMany(products);

  console.log('Seed complete. Example sign-in: owner@example.com / Password123!');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => {
  console.error('Seeding failed', err);
  process.exit(1);
});