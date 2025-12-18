const pool = require('./config/db');
require('dotenv').config();

const users = [
  {
    email: 'sarah.johnson@example.com',
    password: '$2b$10$xQqVZ8K3lXKJ4X8vZ9xW5eF.WxJhZ6KpY9qHxW5eF.WxJhZ6KpY9q',
    first_name: 'Sarah',
    last_name: 'Johnson',
    gender: 'Female',
    dob: '1998-03-15',
    current_location: 'Bangalore',
    from_location: 'Mumbai',
    profile_pic_url: 'https://randomuser.me/api/portraits/women/1.jpg',
    height: 165,
    relationship_status: 'Single',
    pets: 'Love Dogs',
    drinking: 'Socially',
    smoking: 'No',
    food_preference: 'Vegetarian',
    religious_level: 'Not Religious',
    kids_preference: 'Want Someday',
    favourite_travel_destination: 'Japan',
    interests: JSON.stringify(['Photography', 'Hiking', 'Coffee', 'Travel', 'Reading']),
    instagram: '@sarah_adventures',
    linkedin: 'https://linkedin.com/in/sarahjohnson',
    face_photos: JSON.stringify(['https://randomuser.me/api/portraits/women/1.jpg', 'https://randomuser.me/api/portraits/women/11.jpg', 'https://randomuser.me/api/portraits/women/21.jpg']),
    intent: JSON.stringify({
      bio: 'Love exploring new cafes and hiking trails on weekends. Always up for deep conversations over coffee ☕',
      lifestyleImageUrls: ['https://images.unsplash.com/photo-1469474968028-56623f02e42e', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', 'https://images.unsplash.com/photo-1445905595283-21f8ae8a33d2'],
      profileQuestions: {
        jobTitle: 'Product Designer',
        companyName: 'Tech Startup',
        education: 'MIT',
        educationLevel: 'Masters',
        sleepSchedule: 'Early Bird',
        dateBill: 'Split the bill',
        relationshipValues: ['Honesty', 'Communication'],
        religion: 'Agnostic',
        livingSituation: 'Renting',
        languages: ['English', 'Hindi', 'Spanish']
      },
      movies: ['Inception', 'La La Land', 'The Grand Budapest Hotel'],
      tvShows: ['Breaking Bad', 'The Crown'],
      artistsBands: ['Coldplay', 'Taylor Swift'],
      watchList: ['The Matrix', 'Parasite']
    }),
    onboarding_complete: true,
    approval: true
  },
  {
    email: 'alex.chen@example.com',
    password: '$2b$10$xQqVZ8K3lXKJ4X8vZ9xW5eF.WxJhZ6KpY9qHxW5eF.WxJhZ6KpY9q',
    first_name: 'Alex',
    last_name: 'Chen',
    gender: 'Male',
    dob: '1996-07-22',
    current_location: 'Mumbai',
    from_location: 'Delhi',
    profile_pic_url: 'https://randomuser.me/api/portraits/men/1.jpg',
    height: 178,
    relationship_status: 'Single',
    pets: 'Have Cats',
    drinking: 'Often',
    smoking: 'No',
    food_preference: 'Non-Vegetarian',
    religious_level: 'Moderately Religious',
    kids_preference: 'Want Someday',
    favourite_travel_destination: 'Italy',
    interests: JSON.stringify(['Coding', 'Cooking', 'Gaming', 'Fitness', 'Travel']),
    instagram: '@alex_chen_dev',
    linkedin: 'https://linkedin.com/in/alexchen',
    face_photos: JSON.stringify(['https://randomuser.me/api/portraits/men/1.jpg', 'https://randomuser.me/api/portraits/men/11.jpg', 'https://randomuser.me/api/portraits/men/21.jpg']),
    intent: JSON.stringify({
      bio: 'Tech enthusiast by day, amateur chef by night. Looking for someone to share adventures with 🌍',
      lifestyleImageUrls: ['https://images.unsplash.com/photo-1504674900247-0877df9cc836', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438', 'https://images.unsplash.com/photo-1511379938547-c1f69419868d'],
      profileQuestions: {
        jobTitle: 'Software Engineer',
        companyName: 'Google',
        education: 'IIT Delhi',
        educationLevel: 'Bachelors',
        sleepSchedule: 'Night Owl',
        dateBill: 'I will pay',
        relationshipValues: ['Trust', 'Adventure'],
        religion: 'Buddhist',
        livingSituation: 'Own Place',
        languages: ['English', 'Mandarin', 'Hindi']
      },
      movies: ['The Matrix', 'Interstellar', 'Blade Runner'],
      tvShows: ['Stranger Things', 'Black Mirror'],
      artistsBands: ['The Weeknd', 'Daft Punk'],
      watchList: ['Dune', 'Avatar 2']
    }),
    onboarding_complete: true,
    approval: true
  },
  {
    email: 'priya.sharma@example.com',
    password: '$2b$10$xQqVZ8K3lXKJ4X8vZ9xW5eF.WxJhZ6KpY9qHxW5eF.WxJhZ6KpY9q',
    first_name: 'Priya',
    last_name: 'Sharma',
    gender: 'Female',
    dob: '1997-11-08',
    current_location: 'Delhi',
    from_location: 'Jaipur',
    profile_pic_url: 'https://randomuser.me/api/portraits/women/2.jpg',
    height: 160,
    relationship_status: 'Single',
    pets: 'No Pets',
    drinking: 'Never',
    smoking: 'No',
    food_preference: 'Vegetarian',
    religious_level: 'Deeply Religious',
    kids_preference: 'Want Many',
    favourite_travel_destination: 'Paris',
    interests: JSON.stringify(['Yoga', 'Dancing', 'Painting', 'Music', 'Meditation']),
    instagram: '@priya.art',
    linkedin: 'https://linkedin.com/in/priyasharma',
    face_photos: JSON.stringify(['https://randomuser.me/api/portraits/women/2.jpg', 'https://randomuser.me/api/portraits/women/12.jpg', 'https://randomuser.me/api/portraits/women/22.jpg']),
    intent: JSON.stringify({
      bio: 'Artist and yoga instructor finding balance in life. Love creating art and spreading positive vibes ✨',
      lifestyleImageUrls: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773', 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b'],
      profileQuestions: {
        jobTitle: 'Yoga Instructor',
        companyName: 'Self Employed',
        education: 'Delhi University',
        educationLevel: 'Bachelors',
        sleepSchedule: 'Early Bird',
        dateBill: 'Split the bill',
        relationshipValues: ['Spirituality', 'Kindness'],
        religion: 'Hindu',
        livingSituation: 'With Family',
        languages: ['Hindi', 'English']
      },
      movies: ['Eat Pray Love', 'The Notebook', 'Amelie'],
      tvShows: ['Friends', 'Modern Family'],
      artistsBands: ['Adele', 'Ed Sheeran'],
      watchList: ['La La Land', 'The Greatest Showman']
    }),
    onboarding_complete: true,
    approval: true
  },
  {
    email: 'rahul.verma@example.com',
    password: '$2b$10$xQqVZ8K3lXKJ4X8vZ9xW5eF.WxJhZ6KpY9qHxW5eF.WxJhZ6KpY9q',
    first_name: 'Rahul',
    last_name: 'Verma',
    gender: 'Male',
    dob: '1995-05-30',
    current_location: 'Bangalore',
    from_location: 'Pune',
    profile_pic_url: 'https://randomuser.me/api/portraits/men/2.jpg',
    height: 182,
    relationship_status: 'Single',
    pets: 'Love Dogs',
    drinking: 'Socially',
    smoking: 'Occasionally',
    food_preference: 'Non-Vegetarian',
    religious_level: 'Not Religious',
    kids_preference: 'Open to Kids',
    favourite_travel_destination: 'New York',
    interests: JSON.stringify(['Sports', 'Photography', 'Cricket', 'Music', 'Traveling']),
    instagram: '@rahul_captures',
    linkedin: 'https://linkedin.com/in/rahulverma',
    face_photos: JSON.stringify(['https://randomuser.me/api/portraits/men/2.jpg', 'https://randomuser.me/api/portraits/men/12.jpg', 'https://randomuser.me/api/portraits/men/22.jpg']),
    intent: JSON.stringify({
      bio: 'Sports enthusiast and photographer. Believer in living life to the fullest! 📸⚽',
      lifestyleImageUrls: ['https://images.unsplash.com/photo-1452626038306-9aae5e071dd3', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853'],
      profileQuestions: {
        jobTitle: 'Marketing Manager',
        companyName: 'Amazon',
        education: 'Symbiosis',
        educationLevel: 'MBA',
        sleepSchedule: 'Flexible',
        dateBill: 'I will pay',
        relationshipValues: ['Fun', 'Loyalty'],
        religion: 'Agnostic',
        livingSituation: 'Renting',
        languages: ['English', 'Hindi', 'Marathi']
      },
      movies: ['The Shawshank Redemption', 'The Dark Knight', 'Forrest Gump'],
      tvShows: ['Game of Thrones', 'The Office'],
      artistsBands: ['Imagine Dragons', 'Linkin Park'],
      watchList: ['Oppenheimer', 'Mission Impossible']
    }),
    onboarding_complete: true,
    approval: true
  },
  {
    email: 'ananya.kapoor@example.com',
    password: '$2b$10$xQqVZ8K3lXKJ4X8vZ9xW5eF.WxJhZ6KpY9qHxW5eF.WxJhZ6KpY9q',
    first_name: 'Ananya',
    last_name: 'Kapoor',
    gender: 'Female',
    dob: '1999-01-12',
    current_location: 'Mumbai',
    from_location: 'Mumbai',
    profile_pic_url: 'https://randomuser.me/api/portraits/women/3.jpg',
    height: 168,
    relationship_status: 'Single',
    pets: 'Have Cats',
    drinking: 'Often',
    smoking: 'No',
    food_preference: 'Vegan',
    religious_level: 'Not Religious',
    kids_preference: 'Do Not Want',
    favourite_travel_destination: 'Bali',
    interests: JSON.stringify(['Fashion', 'Blogging', 'Fitness', 'Shopping', 'Food']),
    instagram: '@ananya_style',
    linkedin: 'https://linkedin.com/in/ananyakapoor',
    face_photos: JSON.stringify(['https://randomuser.me/api/portraits/women/3.jpg', 'https://randomuser.me/api/portraits/women/13.jpg', 'https://randomuser.me/api/portraits/women/23.jpg']),
    intent: JSON.stringify({
      bio: 'Fashion blogger and fitness enthusiast. Living my best life one outfit at a time! 👗💪',
      lifestyleImageUrls: ['https://images.unsplash.com/photo-1483985988355-763728e1935b', 'https://images.unsplash.com/photo-1540553016722-983e48a2cd10', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061'],
      profileQuestions: {
        jobTitle: 'Fashion Blogger',
        companyName: 'Self Employed',
        education: 'NIFT',
        educationLevel: 'Bachelors',
        sleepSchedule: 'Night Owl',
        dateBill: 'Split the bill',
        relationshipValues: ['Independence', 'Style'],
        religion: 'Atheist',
        livingSituation: 'Own Place',
        languages: ['English', 'Hindi', 'French']
      },
      movies: ['The Devil Wears Prada', 'Clueless', 'Breakfast at Tiffanys'],
      tvShows: ['Gossip Girl', 'Emily in Paris'],
      artistsBands: ['Ariana Grande', 'Billie Eilish'],
      watchList: ['Barbie', 'The Fashion Fund']
    }),
    onboarding_complete: true,
    approval: true
  },
  {
    email: 'vikram.singh@example.com',
    password: '$2b$10$xQqVZ8K3lXKJ4X8vZ9xW5eF.WxJhZ6KpY9qHxW5eF.WxJhZ6KpY9q',
    first_name: 'Vikram',
    last_name: 'Singh',
    gender: 'Male',
    dob: '1994-09-18',
    current_location: 'Delhi',
    from_location: 'Chandigarh',
    profile_pic_url: 'https://randomuser.me/api/portraits/men/3.jpg',
    height: 185,
    relationship_status: 'Single',
    pets: 'No Pets',
    drinking: 'Socially',
    smoking: 'No',
    food_preference: 'Non-Vegetarian',
    religious_level: 'Moderately Religious',
    kids_preference: 'Want Someday',
    favourite_travel_destination: 'Dubai',
    interests: JSON.stringify(['Business', 'Golf', 'Cars', 'Travel', 'Wine']),
    instagram: '@vikram_entrepreneur',
    linkedin: 'https://linkedin.com/in/vikramsingh',
    face_photos: JSON.stringify(['https://randomuser.me/api/portraits/men/3.jpg', 'https://randomuser.me/api/portraits/men/13.jpg', 'https://randomuser.me/api/portraits/men/23.jpg']),
    intent: JSON.stringify({
      bio: 'Entrepreneur and adventure seeker. Building dreams and exploring the world 🚀',
      lifestyleImageUrls: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf', 'https://images.unsplash.com/photo-1552664730-d307ca884978', 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a'],
      profileQuestions: {
        jobTitle: 'Founder & CEO',
        companyName: 'Tech Ventures',
        education: 'IIM Ahmedabad',
        educationLevel: 'MBA',
        sleepSchedule: 'Flexible',
        dateBill: 'I will pay',
        relationshipValues: ['Ambition', 'Adventure'],
        religion: 'Sikh',
        livingSituation: 'Own Place',
        languages: ['English', 'Hindi', 'Punjabi']
      },
      movies: ['The Wolf of Wall Street', 'The Social Network', 'Iron Man'],
      tvShows: ['Suits', 'Billions'],
      artistsBands: ['Drake', 'The Weeknd'],
      watchList: ['Top Gun Maverick', 'Ferrari']
    }),
    onboarding_complete: true,
    approval: true
  }
];

async function seedUsers() {
  try {
    console.log('Starting to seed users...');
    
    for (const user of users) {
      try {
        const [result] = await pool.query(
          `INSERT INTO users (
            email, password, first_name, last_name, gender, dob, 
            current_location, from_location, profile_pic_url, height,
            relationship_status, pets, drinking, smoking, food_preference,
            religious_level, kids_preference, favourite_travel_destination,
            interests, instagram, linkedin, face_photos, intent,
            onboarding_complete, approval
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            user.email, user.password, user.first_name, user.last_name, user.gender, user.dob,
            user.current_location, user.from_location, user.profile_pic_url, user.height,
            user.relationship_status, user.pets, user.drinking, user.smoking, user.food_preference,
            user.religious_level, user.kids_preference, user.favourite_travel_destination,
            user.interests, user.instagram, user.linkedin, user.face_photos, user.intent,
            user.onboarding_complete, user.approval
          ]
        );
        console.log(`✅ Added user: ${user.first_name} ${user.last_name}`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  User ${user.email} already exists, skipping...`);
        } else {
          console.error(`❌ Error adding ${user.first_name}:`, err.message);
        }
      }
    }
    
    // Show summary
    const [rows] = await pool.query('SELECT COUNT(*) as total FROM users WHERE approval = true');
    console.log(`\n✅ Total approved users in database: ${rows[0].total}`);
    
    const [allUsers] = await pool.query('SELECT first_name, last_name, email, gender FROM users WHERE approval = true');
    console.log('\nApproved users:');
    allUsers.forEach(u => console.log(`- ${u.first_name} ${u.last_name} (${u.gender}) - ${u.email}`));
    
    process.exit(0);
  } catch (err) {
    console.error('Error seeding users:', err);
    process.exit(1);
  }
}

seedUsers();
