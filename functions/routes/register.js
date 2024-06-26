const express = require('express');
const PetRegisterModel = require('../models/register');
const multer = require('multer');
const registerRouter = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware function to get a register by ID
async function getRegister(req, res, next) {
    try {
        const register = await PetRegisterModel.findById(req.params.id);
        if (!register) {
            return res.status(404).json({ message: 'Register not found' });
        }
        res.register = register;
        next();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}


//GET all registers
registerRouter.get('/register', async (req, res) => {
    try {
        const registers = await PetRegisterModel.find();
        res.json(registers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//GET a single register
registerRouter.get('/register/:id', getRegister, (req, res) => {
    res.json(res.register);
});


// CREATE a register
registerRouter.post('/register', upload.single('petPhoto'), async (req, res) => {
    try {
        const { ownerInfo, petInfo } = req.body;

        // Parse the ownerInfo and petInfo from JSON strings
        const parsedOwnerInfo = JSON.parse(ownerInfo);
        let parsedPetInfo = JSON.parse(petInfo);

        // Validate required fields
        if (!parsedOwnerInfo.lastName || !parsedOwnerInfo.firstName || !parsedPetInfo.petName) {
            return res.status(400).json({ message: 'Owner last name, first name, and pet name are required' });
        }

        // Handle the pet photo file
        let petPhoto = null;
        if (req.file) {
            petPhoto = req.file.buffer;
        }

        // Update petInfo to include petPhoto
        parsedPetInfo = { ...parsedPetInfo, petPhoto };


        // Create a new register document
        const newRegister = new PetRegisterModel({ ownerInfo: parsedOwnerInfo, petInfo: parsedPetInfo });
        await newRegister.save();
        res.status(201).json({ message: 'Register created successfully', register: newRegister });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// UPDATE a register
registerRouter.patch('/register/:id', getRegister, upload.single('petPhoto'), async (req, res) => {
    try {
        const { ownerInfo, petInfo } = req.body;
        if (ownerInfo) {
            res.register.ownerInfo = { ...res.register.ownerInfo, ...JSON.parse(ownerInfo) };
        }
        if (petInfo) {
            res.register.petInfo = { ...res.register.petInfo, ...JSON.parse(petInfo) };
            if (req.file) {
                res.register.petInfo.petPhoto = req.file.buffer;
            }
        }
        const updatedRegister = await res.register.save();
        res.json(updatedRegister);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT route for updating a register
registerRouter.put('/register/:id', getRegister, upload.single('petPhoto'), async (req, res) => {
    try {
        const { ownerInfo, petInfo } = req.body;
        const updatedOwnerInfo = ownerInfo ? JSON.parse(ownerInfo) : res.register.ownerInfo;
        const updatedPetInfo = petInfo ? JSON.parse(petInfo) : res.register.petInfo;
        if (req.file) {
            updatedPetInfo.petPhoto = req.file.buffer;
        }
        res.register.ownerInfo = updatedOwnerInfo;
        res.register.petInfo = updatedPetInfo;
        const updatedRegister = await res.register.save();
        res.json(updatedRegister);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE a register
registerRouter.delete('/register/:id', getRegister, async (req, res) => {
    try {
        await res.register.remove();
        res.json({ message: 'Register deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


module.exports = registerRouter;
