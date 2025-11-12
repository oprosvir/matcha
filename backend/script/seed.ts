import { faker } from "@faker-js/faker/locale/en_US";
import { Gender, SexualOrientation } from "../src/users/enums/user.enums";
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import cities from 'cities.json';
import { createClient } from 'redis';
import { calculateFameRating, FameRatingMetrics } from '../src/users/utils/fame-rating.calculator';

interface RandomUser {
  id: string;
  password: string;
  gender: Gender;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  sexualOrientation: SexualOrientation;
  biography: string;
  fameRating: number;
  latitude: number;
  longitude: number;
  cityName: string;
  countryName: string;
  lastTimeActive: Date;
  portraitUrl: string;
  interests: string[];
  dateOfBirth: Date;
}

faker.seed(55);

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'matcha',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
});

const redisClient = createClient({
  url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

const NUM_USERS = 500;
const MAIN_USER_EMAIL = process.env.DEV_ACCOUNT_EMAIL || 'test@example.com';
const MAIN_USER_USERNAME = process.env.DEV_ACCOUNT_USERNAME || 'testuser';
const MAIN_USER_FIRSTNAME = process.env.DEV_ACCOUNT_FIRSTNAME || 'Test';
const MAIN_USER_LASTNAME = process.env.DEV_ACCOUNT_LASTNAME || 'User';
const MAIN_USER_PASSWORD = process.env.DEV_ACCOUNT_PASSWORD || 'password123';

// Second test user with incomplete profile
const INCOMPLETE_USER_EMAIL = process.env.DEV_INCOMPLETE_EMAIL || 'incomplete@example.com';
const INCOMPLETE_USER_USERNAME = process.env.DEV_INCOMPLETE_USERNAME || 'incomplete';
const INCOMPLETE_USER_FIRSTNAME = process.env.DEV_INCOMPLETE_FIRSTNAME || 'Incomplete';
const INCOMPLETE_USER_LASTNAME = process.env.DEV_INCOMPLETE_LASTNAME || 'Profile';
const INCOMPLETE_USER_PASSWORD = process.env.DEV_INCOMPLETE_PASSWORD || 'password123';

const interests = [
  ('#Travel'),
  ('#Music'),
  ('#Gym'),
  ('#Coffee'),
  ('#Films'),
  ('#Walking'),
  ('#Netflix'),
  ('#Shopping'),
  ('#Outdoors'),
  ('#Football'),
  ('#Sports'),
  ('#WorkingOut'),
  ('#Cooking'),
  ('#Yoga'),
  ('#Hiking'),
  ('#Photography'),
  ('#Reading'),
  ('#Dancing'),
  ('#Meditation'),
  ('#Gaming'),
  ('#Art'),
  ('#Biking'),
  ('#Beach'),
  ('#Surfing'),
  ('#Volunteering'),
  ('#Technology'),
  ('#Entrepreneurship'),
  ('#Animals'),
  ('#Fashion'),
  ('#Movies'),
  ('#Crafts'),
  ('#TravelBlogging'),
  ('#Running'),
  ('#Kayaking'),
  ('#ComedyShows')];

const interestsIds = faker.helpers.uniqueArray(faker.string.uuid, interests.length);

interface City {
  name: string;
  country: string;
  lat: number;
  lng: number;
}

interface CityFromJson {
  name: string;
  lat: string;
  lng: string;
  country: string;
  admin1: string;
  admin2: string;
}

const citiesArray = cities as unknown as CityFromJson[];

function getRandomCity(): City {
  const randomIndex = faker.number.int({ min: 0, max: citiesArray.length - 1 });
  return {
    name: citiesArray[randomIndex].name,
    country: citiesArray[randomIndex].country,
    lat: parseFloat(citiesArray[randomIndex].lat),
    lng: parseFloat(citiesArray[randomIndex].lng),
  };
}

function createRandomUser(): RandomUser {
  const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

  const id = faker.string.uuid();
  const password = faker.internet.password();
  const gender: Gender = faker.helpers.arrayElement([Gender.MALE, Gender.FEMALE]);
  const firstName = faker.person.firstName(gender);
  const lastName = faker.person.lastName();
  const username = faker.internet.username({ firstName, lastName });
  const email = faker.internet.email({ firstName, lastName });
  const sexualOrientation: SexualOrientation = faker.helpers.arrayElement([SexualOrientation.STRAIGHT, SexualOrientation.GAY, SexualOrientation.BISEXUAL]);
  const biography = faker.lorem.paragraph();
  const fameRating = 0;
  const city = getRandomCity();
  let cityName = '';
  let latitude = 0;
  let longitude = 0;
  let countryName = regionNames.of(city.country);
  if (!countryName) {
    cityName = 'New York';
    countryName = 'United States';
    latitude = 40.7128;
    longitude = -74.0060;
  } else {
    cityName = city.name;
    latitude = city.lat;
    longitude = city.lng;
  }
  const lastTimeActive = faker.date.recent();
  const portraitUrl = faker.image.personPortrait({ sex: gender, size: 512 });
  const interests = faker.helpers.uniqueArray(interestsIds, faker.number.int({ min: 1, max: interestsIds.length }));
  const dateOfBirth = faker.date.birthdate({ min: 18, max: 70, mode: 'age' });

  return {
    id,
    password,
    gender,
    firstName,
    lastName,
    username,
    email,
    sexualOrientation,
    biography,
    fameRating,
    latitude,
    longitude,
    cityName,
    countryName,
    lastTimeActive,
    portraitUrl,
    interests,
    dateOfBirth,
  };
}

async function seedDatabase() {
  try {
    await redisClient.connect();
    console.log('✅ Connected to Redis');

    const client = await pool.connect();
    console.log('✅ Connected to database');

    // Check if database already contains users
    const { rows } = await client.query('SELECT COUNT(*) FROM users');
    const userCount = Number(rows[0].count);

    if (userCount > 0) {
      console.log(`⚠️ Database already contains ${userCount} users — skipping seeding.`);
      client.release();
      return;
    }

    console.log('🌱 Starting database seeding...');

    // Create main test user first
    const mainUserId = faker.string.uuid();
    const mainUserPasswordHash = await bcrypt.hash(MAIN_USER_PASSWORD, 10);

    console.log('👤 Creating main test user...');

    const mainUserBirthDate = new Date();
    mainUserBirthDate.setFullYear(mainUserBirthDate.getFullYear() - 25); // 25 years old

    await client.query(`
      INSERT INTO users (id, username, email, is_email_verified, password_hash, first_name, last_name, gender, sexual_orientation, biography, fame_rating, latitude, longitude, city_name, country_name, last_time_active, date_of_birth, profile_completed)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    `, [
      mainUserId,
      MAIN_USER_USERNAME,
      MAIN_USER_EMAIL,
      true,
      mainUserPasswordHash,
      MAIN_USER_FIRSTNAME,
      MAIN_USER_LASTNAME,
      Gender.MALE,
      SexualOrientation.STRAIGHT,
      `Hi! I'm ${MAIN_USER_FIRSTNAME} and this is my test account with many matches and interactions!`,
      0, // Will be calculated later based on real metrics
      40.7128,
      -74.0060,
      'New York',
      'United States',
      new Date(),
      mainUserBirthDate,
      true
    ]);

    // Create second test user with incomplete profile
    const incompleteUserId = faker.string.uuid();
    const incompleteUserPasswordHash = await bcrypt.hash(INCOMPLETE_USER_PASSWORD, 10);

    console.log('👤 Creating incomplete test user...');

    const incompleteUserBirthDate = new Date();
    incompleteUserBirthDate.setFullYear(incompleteUserBirthDate.getFullYear() - 22); // 22 years old

    await client.query(`
      INSERT INTO users (id, username, email, is_email_verified, password_hash, first_name, last_name, profile_completed)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      incompleteUserId,
      INCOMPLETE_USER_USERNAME,
      INCOMPLETE_USER_EMAIL,
      true,
      incompleteUserPasswordHash,
      INCOMPLETE_USER_FIRSTNAME,
      INCOMPLETE_USER_LASTNAME,
      false // profile not completed
    ]);

    // Generate all other users
    const users: RandomUser[] = [];
    for (let i = 0; i < NUM_USERS; i++) {
      users.push(createRandomUser());
    }

    const BATCH_SIZE = 50;
    for (let i = 0; i < NUM_USERS; i += BATCH_SIZE) {
      const batchEnd = Math.min(i + BATCH_SIZE, NUM_USERS);
      console.log(`📝 Inserting users ${i + 1}-${batchEnd}...`);

      const values: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      for (let j = i; j < batchEnd; j++) {
        const user = users[j];
        const passwordHash = await bcrypt.hash(user.password, 10);
        values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8}, $${paramIndex + 9}, $${paramIndex + 10}, $${paramIndex + 11}, $${paramIndex + 12}, $${paramIndex + 13}, $${paramIndex + 14}, $${paramIndex + 15}, $${paramIndex + 16}, $${paramIndex + 17})`);

        params.push(
          user.id,
          user.username,
          user.email,
          true, // is_email_verified
          passwordHash,
          user.firstName,
          user.lastName,
          user.gender,
          user.sexualOrientation,
          user.biography,
          user.fameRating,
          user.latitude,
          user.longitude,
          user.cityName,
          user.countryName,
          user.lastTimeActive,
          user.dateOfBirth,
          true // profile_completed
        );
        paramIndex += 18;
        try {
          await redisClient.incr(`location:${user.cityName}, ${user.countryName}`);
        } catch (error) {
          console.error('Failed to increment location counter in Redis:', error);
          throw new Error('Failed to increment location counter in Redis');
        }
      }

      const query = `
        INSERT INTO users (id, username, email, is_email_verified, password_hash, first_name, last_name, gender, sexual_orientation, biography, fame_rating, latitude, longitude, city_name, country_name, last_time_active, date_of_birth, profile_completed)
        VALUES ${values.join(', ')}
      `;

      await client.query(query, params);
    }

    console.log(`✅ Successfully inserted ${NUM_USERS} users`);

    console.log('💕 Adding random likes...');
    const likeCount = Math.floor(NUM_USERS * 0.3); // 30% of users will have likes
    for (let i = 0; i < likeCount; i++) {
      const fromUser = users[faker.number.int({ min: 0, max: NUM_USERS - 1 })];
      const toUser = users[faker.number.int({ min: 0, max: NUM_USERS - 1 })];

      if (fromUser.id !== toUser.id) {
        try {
          await client.query(
            'INSERT INTO likes (from_user_id, to_user_id) VALUES ($1, $2) ON CONFLICT (from_user_id, to_user_id) DO NOTHING',
            [fromUser.id, toUser.id]
          );
        } catch (error) {
          // Ignore duplicate key errors
        }
      }
    }

    console.log('✅ Added random likes');

    console.log('👀 Adding profile views...');
    const viewCount = Math.floor(NUM_USERS * 0.5); // 50% of users will have views
    for (let i = 0; i < viewCount; i++) {
      const viewer = users[faker.number.int({ min: 0, max: NUM_USERS - 1 })];
      const viewed = users[faker.number.int({ min: 0, max: NUM_USERS - 1 })];

      if (viewer.id !== viewed.id) {
        try {
          await client.query(
            'INSERT INTO profile_views (viewer_id, viewed_id) VALUES ($1, $2)',
            [viewer.id, viewed.id]
          );
        } catch (error) {
          // Ignore any errors
        }
      }
    }

    console.log('✅ Added profile views');

    console.log('🔍 Adding interests...');

    for (let i = 0; i < interests.length; i++) {
      await client.query(
        'INSERT INTO interests (id, name) VALUES ($1, $2)',
        [interestsIds[i], interests[i]]
      );
    }

    console.log('✅ Added interests');

    console.log('🔍 Adding user interests...');
    for (let i = 0; i < NUM_USERS; i++) {
      const user = users[i];

      // Insert each interest individually
      for (const interestId of user.interests) {
        try {
          await client.query(
            'INSERT INTO user_interests (user_id, interest_id) VALUES ($1, $2)',
            [user.id, interestId]
          );
        } catch (error) {
          // Ignore duplicate key errors
        }
      }
    }

    console.log('✅ Added user interests');

    console.log('🔍 Adding user photos...');
    for (let i = 0; i < NUM_USERS; i++) {
      const user = users[i];
      await client.query(
        'INSERT INTO user_photos (user_id, url, is_profile_pic) VALUES ($1, $2, TRUE)',
        [user.id, user.portraitUrl]
      );
    }
    console.log('✅ Added user photos');

    // Add main user photo
    console.log('📸 Adding main user photo...');
    await client.query(
      'INSERT INTO user_photos (user_id, url, is_profile_pic) VALUES ($1, $2, TRUE)',
      [mainUserId, faker.image.personPortrait({ sex: 'male', size: 512 })]
    );

    // Alternative approach with RoboHash (commented out)
    //  console.log('🔍 Adding user photos...');
    // for (let i = 0; i < NUM_USERS; i++) {
    //   const user = users[i];
    //   // Generate a stable, unique avatar URL for each user using RoboHash
    //   // This provides consistent avatars without needing to store files
    //   const avatarUrl = `https://robohash.org/${user.id}?set=set5&size=512x512`;

    //   await client.query(
    //     'INSERT INTO user_photos (user_id, url, is_profile_pic) VALUES ($1, $2, TRUE)',
    //     [user.id, avatarUrl]
    //   );
    // }
    // console.log('✅ Added user photos');

    // // Add main user photo
    // console.log('📸 Adding main user photo...');
    // const mainUserAvatarUrl = `https://robohash.org/${mainUserId}?set=set5&size=512x512`;
    // await client.query(
    //   'INSERT INTO user_photos (user_id, url, is_profile_pic) VALUES ($1, $2, TRUE)',
    //   [mainUserId, mainUserAvatarUrl]
    // );

    // Add main user interests
    console.log('🎯 Adding main user interests...');
    const mainUserInterests = faker.helpers.uniqueArray(interestsIds, faker.number.int({ min: 3, max: 8 }));
    for (const interestId of mainUserInterests) {
      await client.query(
        'INSERT INTO user_interests (user_id, interest_id) VALUES ($1, $2)',
        [mainUserId, interestId]
      );
    }

    console.log('Creating main user relationships...');

    const otherUsers = users.map(u => u.id);

    const numMatches = faker.number.int({ min: 20, max: 50 });
    const matchUsers = faker.helpers.arrayElements(otherUsers, numMatches);

    for (const matchUserId of matchUsers) {
      // Create mutual likes (match)
      await client.query(
        'INSERT INTO likes (from_user_id, to_user_id) VALUES ($1, $2) ON CONFLICT (from_user_id, to_user_id) DO NOTHING',
        [mainUserId, matchUserId]
      );
      await client.query(
        'INSERT INTO likes (from_user_id, to_user_id) VALUES ($1, $2) ON CONFLICT (from_user_id, to_user_id) DO NOTHING',
        [matchUserId, mainUserId]
      );

      // Create chat for matches
      const chatId = faker.string.uuid();
      const [user1Id, user2Id] = mainUserId < matchUserId ? [mainUserId, matchUserId] : [matchUserId, mainUserId];
      await client.query(
        'INSERT INTO chats (id, user1_id, user2_id) VALUES ($1, $2, $3) ON CONFLICT (user1_id, user2_id) DO NOTHING',
        [chatId, user1Id, user2Id]
      );
    }

    // 2. Additional likes sent (not matched) - 20-50 more
    const numLikesSent = faker.number.int({ min: 20, max: 50 });
    const likeUsers = faker.helpers.arrayElements(
      otherUsers.filter(id => !matchUsers.includes(id)),
      numLikesSent
    );

    for (const likeUserId of likeUsers) {
      await client.query(
        'INSERT INTO likes (from_user_id, to_user_id) VALUES ($1, $2) ON CONFLICT (from_user_id, to_user_id) DO NOTHING',
        [mainUserId, likeUserId]
      );
    }

    // 3. Additional likes received (not matched) - 20-50 more
    const numLikesReceived = faker.number.int({ min: 20, max: 50 });
    const likedByUsers = faker.helpers.arrayElements(
      otherUsers.filter(id => !matchUsers.includes(id) && !likeUsers.includes(id)),
      numLikesReceived
    );

    for (const likedByUserId of likedByUsers) {
      await client.query(
        'INSERT INTO likes (from_user_id, to_user_id) VALUES ($1, $2) ON CONFLICT (from_user_id, to_user_id) DO NOTHING',
        [likedByUserId, mainUserId]
      );
    }

    // 4. Blocks (main user blocked others) - 5-15
    const numBlocksSent = faker.number.int({ min: 5, max: 15 });
    const blockedUsers = faker.helpers.arrayElements(
      otherUsers.filter(id => !matchUsers.includes(id)),
      numBlocksSent
    );

    for (const blockedUserId of blockedUsers) {
      await client.query(
        'INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT (blocker_id, blocked_id) DO NOTHING',
        [mainUserId, blockedUserId]
      );
    }

    // 5. Blocks (main user was blocked by others) - 5-15
    const numBlocksReceived = faker.number.int({ min: 5, max: 15 });
    const blockedByUsers = faker.helpers.arrayElements(
      otherUsers.filter(id => !matchUsers.includes(id) && !blockedUsers.includes(id)),
      numBlocksReceived
    );

    for (const blockedByUserId of blockedByUsers) {
      await client.query(
        'INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT (blocker_id, blocked_id) DO NOTHING',
        [blockedByUserId, mainUserId]
      );
    }

    // 6. Profile views (main user viewed others)
    const numViewsSent = faker.number.int({ min: 30, max: 80 });
    const viewedUsers = faker.helpers.arrayElements(otherUsers, numViewsSent);

    for (const viewedUserId of viewedUsers) {
      await client.query(
        'INSERT INTO profile_views (viewer_id, viewed_id) VALUES ($1, $2)',
        [mainUserId, viewedUserId]
      );
    }

    // 7. Profile views (main user was viewed by others)
    const numViewsReceived = faker.number.int({ min: 30, max: 80 });
    const viewedByUsers = faker.helpers.arrayElements(otherUsers, numViewsReceived);

    for (const viewedByUserId of viewedByUsers) {
      await client.query(
        'INSERT INTO profile_views (viewer_id, viewed_id) VALUES ($1, $2)',
        [viewedByUserId, mainUserId]
      );
    }

    console.log('❌ Adding reports...');

    const reportCount = Math.floor(NUM_USERS * 0.1); // 10% of users will have reports
    for (let i = 0; i < reportCount; i++) {
      const reporter = users[faker.number.int({ min: 0, max: NUM_USERS - 1 })];
      const reported = users[faker.number.int({ min: 0, max: NUM_USERS - 1 })];

      if (reporter.id !== reported.id) {
        try {
          await client.query(
            'INSERT INTO reports (reporter_id, reported_id, reason) VALUES ($1, $2, $3)',
            [reporter.id, reported.id, faker.lorem.sentence()]
          );
        } catch (error) {
          // Ignore any errors
        }
      }
    }
    console.log('✅ Added reports');

    // Recalculate fame ratings for all users based on real data
    console.log('📊 Recalculating fame ratings for all users...');

    // Get all user IDs
    const allUsersResult = await client.query('SELECT id FROM users');
    const allUserIds = allUsersResult.rows.map((row: { id: string }) => row.id);

    let updatedCount = 0;
    for (const userId of allUserIds) {
      try {
        // Calculate fame rating based on real metrics
        const metricsResult = await client.query(`
          SELECT
            -- Profile completeness metrics
            CASE WHEN u.profile_completed = TRUE THEN 20 ELSE 0 END as profile_completed_points,

            -- Popularity metrics
            (SELECT COUNT(*) FROM likes WHERE to_user_id = u.id) as likes_received,
            (SELECT COUNT(*) FROM profile_views WHERE viewed_id = u.id) as views_received,
            (
              SELECT COUNT(*)
              FROM likes l1
              WHERE l1.to_user_id = u.id
              AND EXISTS (
                SELECT 1 FROM likes l2
                WHERE l2.from_user_id = l1.to_user_id
                AND l2.to_user_id = l1.from_user_id
              )
            ) as matches_count,

            -- Account age in days
            EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - u.created_at)) / 86400 as days_active
          FROM users u
          WHERE u.id = $1
        `, [userId]);

        const data = metricsResult.rows[0];

        // Use the fame rating calculator utility
        const metrics: FameRatingMetrics = {
          profileCompletedPoints: data.profile_completed_points,
          likesReceived: parseInt(data.likes_received),
          viewsReceived: parseInt(data.views_received),
          matchesCount: parseInt(data.matches_count),
          daysActive: parseFloat(data.days_active),
        };

        const fameRating = calculateFameRating(metrics);

        // Update fame rating
        await client.query('UPDATE users SET fame_rating = $1 WHERE id = $2', [fameRating, userId]);
        updatedCount++;
      } catch (error) {
        console.error(`Failed to calculate fame rating for user ${userId}:`, error);
      }
    }

    console.log(`✅ Recalculated fame ratings for ${updatedCount} users`);

    client.release();
    console.log('🎉 Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
    await redisClient.quit();
  }
}

// Run the seeding
seedDatabase().catch(console.error);
