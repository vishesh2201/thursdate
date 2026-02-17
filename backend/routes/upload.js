const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const auth = require('../middleware/auth');
const { validateFacePhoto, verifyProfilePhoto } = require('../config/rekognition');
const db = require('../config/db');
const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Upload profile picture
router.post('/profile-picture', auth, upload.single('image'), async (req, res) => {
  try {
    console.log('Profile picture upload attempt for user ID:', req.user.userId);
    console.log('Cloudinary config:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set'
    });
    
    if (!req.file) {
      console.log('No file received in request');
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('File received:', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferLength: req.file.buffer ? req.file.buffer.length : 0
    });

    // Validate file size
    if (req.file.size > 20 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size too large. Maximum 20MB allowed.' });
    }

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    console.log('Uploading to Cloudinary...');

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'luyona/profile-pictures',
      public_id: `user_${req.user.userId}_${Date.now()}`,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto' }
      ]
    });

    console.log('Upload successful:', {
      url: result.secure_url,
      publicId: result.public_id,
      size: result.bytes
    });

    res.json({
      message: 'Image uploaded successfully',
      url: result.secure_url,
      publicId: result.public_id
    });

  } catch (error) {
    console.error('Profile picture upload error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to upload image: ' + error.message });
  }
});

// Upload lifestyle image
router.post('/lifestyle-image', auth, upload.single('image'), async (req, res) => {
  try {
    console.log('Lifestyle image upload attempt for user ID:', req.user.userId);
    
    if (!req.file) {
      console.log('No file received in request');
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('File received:', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferLength: req.file.buffer ? req.file.buffer.length : 0
    });

    // Validate file size
    if (req.file.size > 20 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size too large. Maximum 20MB allowed.' });
    }

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    console.log('Uploading to Cloudinary...');

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'luyona/lifestyle-images',
      public_id: `user_${req.user.userId}_lifestyle_${Date.now()}`,
      transformation: [
        { width: 800, height: 600, crop: 'fill' },
        { quality: 'auto' }
      ]
    });

    console.log('Lifestyle upload successful:', {
      url: result.secure_url,
      publicId: result.public_id,
      size: result.bytes
    });

    res.json({
      message: 'Image uploaded successfully',
      url: result.secure_url,
      publicId: result.public_id
    });

  } catch (error) {
    console.error('Lifestyle upload error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to upload image: ' + error.message });
  }
});

// Upload face photo (for face verification)
router.post('/face-photo', auth, upload.single('image'), async (req, res) => {
  try {
    console.log('Face photo upload attempt for user ID:', req.user.userId);
    
    if (!req.file) {
      console.log('No file received in request');
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('File received:', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferLength: req.file.buffer ? req.file.buffer.length : 0
    });

    // Validate file size
    if (req.file.size > 20 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size too large. Maximum 20MB allowed.' });
    }

    // STEP 1: Validate face using AWS Rekognition
    console.log('🔍 Validating face with AWS Rekognition...');
    const validation = await validateFacePhoto(req.file.buffer);

    if (!validation.valid) {
      console.log('❌ Face validation failed:', validation.message);
      return res.status(400).json({ 
        error: validation.message,
        faceValidation: false
      });
    }

    console.log('✅ Face validated successfully! Confidence:', validation.confidence);

    // STEP 2: Upload to Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    console.log('☁️ Uploading to Cloudinary...');

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'luyona/face-photos',
      public_id: `user_${req.user.userId}_face_${Date.now()}`,
      transformation: [
        { width: 1600, height: 1600, crop: 'fill', gravity: 'face' },
        { quality: 'auto:best' }
      ]
    });

    console.log('✅ Face photo upload successful:', {
      url: result.secure_url,
      publicId: result.public_id,
      size: result.bytes
    });

    // STEP 3: Save face photo URL to database
    await db.query(
      'UPDATE users SET face_photo_url = ? WHERE id = ?',
      [result.secure_url, req.user.userId]
    );

    console.log('✅ Face photo URL saved to database');

    res.json({
      message: 'Face verified and uploaded successfully!',
      url: result.secure_url,
      publicId: result.public_id,
      faceValidation: true,
      confidence: validation.confidence
    });

  } catch (error) {
    console.error('Face photo upload error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to upload image: ' + error.message });
  }
});

// Verify and upload profile photo (compares with reference face photo)
router.post('/profile-photo-verify', auth, upload.single('image'), async (req, res) => {
  try {
    console.log('Profile photo verification attempt for user ID:', req.user.userId);
    
    if (!req.file) {
      console.log('No file received in request');
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('File received:', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    // Validate file size
    if (req.file.size > 20 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size too large. Maximum 20MB allowed.' });
    }

    // STEP 1: Get user's reference face photo from database
    const [users] = await db.query(
      'SELECT face_photo_url FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (!users || users.length === 0 || !users[0].face_photo_url) {
      return res.status(400).json({ 
        error: 'No reference face photo found. Please complete the verification step first.',
        requiresReference: true
      });
    }

    const referencePhotoUrl = users[0].face_photo_url;
    console.log('📸 Reference photo URL:', referencePhotoUrl);

    // STEP 2: Verify the profile photo against the reference
    console.log('🔍 Verifying profile photo with AWS Rekognition...');
    const verification = await verifyProfilePhoto(referencePhotoUrl, req.file.buffer);

    if (!verification.valid) {
      console.log('❌ Profile photo verification failed:', verification.message);
      return res.status(400).json({ 
        error: verification.message,
        faceVerification: false
      });
    }

    console.log('✅ Profile photo verified! Similarity:', verification.similarity);

    // STEP 3: Upload to Cloudinary
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    console.log('☁️ Uploading to Cloudinary...');

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'luyona/profile-pictures',
      public_id: `user_${req.user.userId}_${Date.now()}`,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto' }
      ]
    });

    console.log('✅ Profile photo upload successful:', {
      url: result.secure_url,
      similarity: verification.similarity
    });

    res.json({
      message: 'Profile photo verified and uploaded successfully!',
      url: result.secure_url,
      publicId: result.public_id,
      faceVerification: true,
      similarity: verification.similarity
    });

  } catch (error) {
    console.error('Profile photo verification error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to verify and upload photo: ' + error.message });
  }
});

// Configure multer for audio files
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for audio
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'), false);
    }
  },
});

// Upload voice message
router.post('/voice-message', auth, audioUpload.single('audio'), async (req, res) => {
  try {
    console.log('Voice message upload attempt for user ID:', req.user.userId);
    
    if (!req.file) {
      console.log('No file received in request');
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('File received:', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferLength: req.file.buffer ? req.file.buffer.length : 0
    });

    // Validate file size
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size too large. Maximum 10MB allowed.' });
    }

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    console.log('Uploading to Cloudinary...');

    // Upload to Cloudinary as video (Cloudinary handles audio as video)
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'sundate/voice-messages',
      public_id: `user_${req.user.userId}_voice_${Date.now()}`,
      resource_type: 'video'
    });

    console.log('Voice upload successful:', {
      url: result.secure_url,
      publicId: result.public_id,
      size: result.bytes
    });

    res.json({
      message: 'Voice message uploaded successfully',
      url: result.secure_url,
      publicId: result.public_id,
      duration: result.duration // Cloudinary provides duration
    });

  } catch (error) {
    console.error('Voice message upload error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to upload voice message: ' + error.message });
  }
});

module.exports = router; 