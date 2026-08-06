const mongoose = require('mongoose');
require('dotenv').config({path: '../.env'});

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Place = mongoose.model('Place', new mongoose.Schema({}, { strict: false }));
  const City = mongoose.model('City', new mongoose.Schema({}, { strict: false }));

  console.log('Fixing Ahemdabad to Ahmedabad...');
  const resPlaces = await Place.updateMany({ city: 'Ahemdabad' }, { $set: { city: 'Ahmedabad' } });
  console.log('Places updated:', resPlaces);
  
  const resCityDel = await City.deleteOne({ city: 'Ahemdabad' });
  console.log('Deleted Ahemdabad city:', resCityDel);

  // New Delhi vs new Delhi
  console.log('Fixing new Delhi to New Delhi...');
  const resPlacesDelhi = await Place.updateMany({ city: 'new Delhi' }, { $set: { city: 'New Delhi' } });
  console.log('Places updated Delhi:', resPlacesDelhi);
  const resCityDelhiDel = await City.deleteOne({ city: 'new Delhi' });
  console.log('Deleted new Delhi city:', resCityDelhiDel);

  console.log('Done.');
  process.exit(0);
}
run();
