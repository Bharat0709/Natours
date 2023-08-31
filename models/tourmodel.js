const mongoose = require('mongoose');
const validator = require('validator');
const slugify = require('slugify');
// const User = require('./usermodel')

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have name'],
      unique: true,
      trim: true,
      maxlength: [40, 'The maximum length of the title is 40 characters'],
      minlength: [10, 'The minimum length of the title is 10 characters'],
    },
    slug: String,

    duration: {
      type: Number,
      required: [true, ' A tour must have duration '],
    },
    maxGroupSize: {
      type: Number,
      required: [true, ' A tour must have group size'],
    },
    difficulty: {
      type: String,
      required: [true, ' A tour must have difficulty'],
      enum: ['easy', 'medium', 'difficult'],
      message: 'Diffulty is either: Easy , Medium or Difficult',
    },
    ratingAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'rating Must be above zero'],
      max: [5, 'Rating must be below 5'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingQuantity: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    price: {
      type: Number,
      required: [true, ' A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validator: function (val) {
        return val < this.price;
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    location: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });
// *SECURITY*

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

tourSchema.pre('save', function (next) {
  // console.log(this.name); // {The Forest}
  this.slug = slugify(this.name, { lower: true });
  // console.log(this.slug); // the-forest
  next();
});

// tourSchema.pre('save', function (next) {
//   console.log("Will save document")
//   next();
// });
// tourSchema.post('save', function (doc , next) {
//  console.log(doc);
//   next();
// });

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });

// tourSchema.pre('save', async function(next){
// const guidesPromises = this.guides.map(async id =>await User.findById(id));
// this.guides = await Promise.all(guidesPromises)
// })

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
