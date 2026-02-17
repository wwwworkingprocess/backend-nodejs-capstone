const express = require('express')
const multer = require('multer')
const router = express.Router()
const connectToDatabase = require('../models/db')
const logger = require('../logger')

// Define the upload directory path
const directoryPath = 'public/images'

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath) // Specify the upload directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname) // Use the original file name
  }
})

const upload = multer({ storage })

// Get all secondChanceItems
router.get('/', async (req, res, next) => {
  logger.info('/ called')
  try {
    // Step 2: task 1 - Connect to MongoDB
    const db = await connectToDatabase()

    // Step 2: task 2 - Retrieve collection
    const collection = db.collection('secondChanceItems')

    // Step 2: task 3 - Fetch all secondChanceItems
    const secondChanceItems = await collection.find({}).toArray()

    // Step 2: task 4 - Return secondChanceItems
    res.json(secondChanceItems)
  } catch (e) {
    logger.console.error('oops something went wrong', e)
    next(e)
  }
})

// Add a new item
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    // Step 3: task 1 - Connect to MongoDB
    const db = await connectToDatabase()

    // Step 3: task 2 - Retrieve collection
    const collection = db.collection('secondChanceItems')

    // Step 3: task 3 - Create a new secondChanceItem from the request body
    let secondChanceItem = req.body

    // Step 3: task 4 - Get the last id, increment it by 1
    const lastItemQuery = await collection.find().sort({ id: -1 }).limit(1)
    await lastItemQuery.forEach((item) => {
      //  and set it to the new secondChanceItem
      secondChanceItem.id = (parseInt(item.id) + 1).toString()
    })

    // Step 3: task 5 - Set the current date to the new item
    const dateAdded = Math.floor(new Date().getTime() / 1000)
    secondChanceItem.date_added = dateAdded

    // Step 3: task 6 - Add the secondChanceItem to the database
    secondChanceItem = await collection.insertOne(secondChanceItem)

    res.status(201).json(secondChanceItem.ops[0])
  } catch (e) {
    next(e)
  }
})

// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    // Step 4: task 1 - Connect to MongoDB
    const db = await connectToDatabase()

    // Step 4: task 2 - Retrieve collection
    const collection = db.collection('secondChanceItems')

    // Step 4: task 3 - Find a specific secondChanceItem by ID
    const secondChanceItem = await collection.findOne({ id })

    // Step 4: task 4 - Return the secondChanceItem
    if (!secondChanceItem) {
      return res.status(404).send('secondChanceItem not found')
    }

    res.json(secondChanceItem)
  } catch (e) {
    next(e)
  }
})

// Update and existing item
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    // Step 5: task 1 -  Retrieve the dtabase connection
    const db = await connectToDatabase()

    // Step 5: task 2 - Retrieve collection
    const collection = db.collection('secondChanceItems')

    // Step 5: task 3 - Check if the secondChanceItem exists
    const secondChanceItem = await collection.findOne({ id })

    if (!secondChanceItem) {
      logger.error('secondChanceItem not found')
      return res.status(404).json({ error: 'secondChanceItem not found' })
    }

    // Step 5: task 4 - Update the item's specific attributes
    secondChanceItem.category = req.body.category
    secondChanceItem.condition = req.body.condition
    secondChanceItem.age_days = req.body.age_days
    secondChanceItem.description = req.body.description
    secondChanceItem.age_years = Number((secondChanceItem.age_days / 365).toFixed(1))
    secondChanceItem.updatedAt = new Date()

    const updatedItem = await collection.findOneAndUpdate(
      { id },
      { $set: secondChanceItem },
      { returnDocument: 'after' }
    )

    // Step 5: task 5 - insert code here
    if (updatedItem) {
      res.json({ uploaded: 'success' })
    } else {
      res.json({ uploaded: 'failed' })
    }
  } catch (e) {
    next(e)
  }
})

// Delete an existing item
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    // Step 6: task 1 -  Retrieve the dtabase connection
    const db = await connectToDatabase()

    // Step 6: task 2 - Retrieve collection
    const collection = db.collection('secondChanceItems')

    // Step 6: task 3 - Find a specific secondChanceItem by ID
    const secondChanceItem = await collection.findOne({ id })

    if (!secondChanceItem) {
      logger.error('secondChanceItem not found')
      return res.status(404).json({ error: 'secondChanceItem not found' })
    }

    // Step 6: task 4 - Delete the object and send an appropriate message
    await collection.deleteOne({ id })
    res.json({ deleted: 'success' })
  } catch (e) {
    next(e)
  }
})

module.exports = router
