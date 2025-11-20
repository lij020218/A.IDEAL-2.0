/**
 * SQLite 데이터베이스의 데이터를 Supabase PostgreSQL로 마이그레이션하는 스크립트
 * 
 * 사용법:
 * 1. .env 파일에 Supabase DATABASE_URL 설정
 * 2. node scripts/migrate-sqlite-to-postgres.js
 */

const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// SQLite 연결 (로컬 dev.db)
const sqliteDb = new Database(path.join(__dirname, '..', 'prisma', 'dev.db'));

// PostgreSQL 연결 (Supabase)
const postgresPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function migrateData() {
  console.log('🚀 데이터 마이그레이션 시작...\n');

  try {
    // 1. Users 마이그레이션
    console.log('📦 Users 마이그레이션 중...');
    const users = sqliteDb.prepare('SELECT * FROM User').all();
    for (const user of users) {
      try {
        await postgresPrisma.user.upsert({
          where: { id: user.id },
          update: {
            email: user.email,
            password: user.password,
            name: user.name,
            plan: user.plan || 'free',
            promptCopiesToday: user.promptCopiesToday || 0,
            promptCopiesResetAt: user.promptCopiesResetAt ? new Date(user.promptCopiesResetAt) : null,
            growthContentToday: user.growthContentToday || 0,
            growthContentResetAt: user.growthContentResetAt ? new Date(user.growthContentResetAt) : null,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
          },
          create: {
            id: user.id,
            email: user.email,
            password: user.password,
            name: user.name,
            plan: user.plan || 'free',
            promptCopiesToday: user.promptCopiesToday || 0,
            promptCopiesResetAt: user.promptCopiesResetAt ? new Date(user.promptCopiesResetAt) : null,
            growthContentToday: user.growthContentToday || 0,
            growthContentResetAt: user.growthContentResetAt ? new Date(user.growthContentResetAt) : null,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
          },
        });
      } catch (error) {
        console.error(`  ❌ User ${user.id} 마이그레이션 실패:`, error.message);
      }
    }
    console.log(`  ✅ ${users.length}개 Users 마이그레이션 완료\n`);

    // 2. Prompts 마이그레이션
    console.log('📦 Prompts 마이그레이션 중...');
    const prompts = sqliteDb.prepare('SELECT * FROM Prompt').all();
    for (const prompt of prompts) {
      try {
        await postgresPrisma.prompt.upsert({
          where: { id: prompt.id },
          update: {
            userId: prompt.userId,
            topic: prompt.topic,
            prompt: prompt.prompt,
            category: prompt.category,
            recommendedTools: prompt.recommendedTools,
            tips: prompt.tips,
            imageUrl: prompt.imageUrl,
            isPublic: prompt.isPublic === 1 || prompt.isPublic === true,
            parentId: prompt.parentId,
            aiProvider: prompt.aiProvider,
            aiModel: prompt.aiModel,
            views: prompt.views || 0,
            averageRating: prompt.averageRating,
            ratingCount: prompt.ratingCount || 0,
            createdAt: new Date(prompt.createdAt),
            updatedAt: new Date(prompt.updatedAt),
          },
          create: {
            id: prompt.id,
            userId: prompt.userId,
            topic: prompt.topic,
            prompt: prompt.prompt,
            category: prompt.category,
            recommendedTools: prompt.recommendedTools,
            tips: prompt.tips,
            imageUrl: prompt.imageUrl,
            isPublic: prompt.isPublic === 1 || prompt.isPublic === true,
            parentId: prompt.parentId,
            aiProvider: prompt.aiProvider,
            aiModel: prompt.aiModel,
            views: prompt.views || 0,
            averageRating: prompt.averageRating,
            ratingCount: prompt.ratingCount || 0,
            createdAt: new Date(prompt.createdAt),
            updatedAt: new Date(prompt.updatedAt),
          },
        });
      } catch (error) {
        console.error(`  ❌ Prompt ${prompt.id} 마이그레이션 실패:`, error.message);
      }
    }
    console.log(`  ✅ ${prompts.length}개 Prompts 마이그레이션 완료\n`);

    // 3. PromptRatings 마이그레이션
    console.log('📦 PromptRatings 마이그레이션 중...');
    const ratings = sqliteDb.prepare('SELECT * FROM PromptRating').all();
    for (const rating of ratings) {
      try {
        await postgresPrisma.promptRating.upsert({
          where: { promptId_userId: { promptId: rating.promptId, userId: rating.userId } },
          update: {
            rating: rating.rating,
            createdAt: new Date(rating.createdAt),
            updatedAt: new Date(rating.updatedAt),
          },
          create: {
            id: rating.id,
            promptId: rating.promptId,
            userId: rating.userId,
            rating: rating.rating,
            createdAt: new Date(rating.createdAt),
            updatedAt: new Date(rating.updatedAt),
          },
        });
      } catch (error) {
        console.error(`  ❌ Rating ${rating.id} 마이그레이션 실패:`, error.message);
      }
    }
    console.log(`  ✅ ${ratings.length}개 PromptRatings 마이그레이션 완료\n`);

    // 4. Challenges 마이그레이션
    console.log('📦 Challenges 마이그레이션 중...');
    const challenges = sqliteDb.prepare('SELECT * FROM Challenge').all();
    for (const challenge of challenges) {
      try {
        await postgresPrisma.challenge.upsert({
          where: { id: challenge.id },
          update: {
            userId: challenge.userId,
            title: challenge.title,
            description: challenge.description,
            codeSnippet: challenge.codeSnippet,
            ideaDetails: challenge.ideaDetails,
            resumeUrl: challenge.resumeUrl,
            contactInfo: challenge.contactInfo,
            tags: challenge.tags,
            createdAt: new Date(challenge.createdAt),
            updatedAt: new Date(challenge.updatedAt),
          },
          create: {
            id: challenge.id,
            userId: challenge.userId,
            title: challenge.title,
            description: challenge.description,
            codeSnippet: challenge.codeSnippet,
            ideaDetails: challenge.ideaDetails,
            resumeUrl: challenge.resumeUrl,
            contactInfo: challenge.contactInfo,
            tags: challenge.tags,
            createdAt: new Date(challenge.createdAt),
            updatedAt: new Date(challenge.updatedAt),
          },
        });
      } catch (error) {
        console.error(`  ❌ Challenge ${challenge.id} 마이그레이션 실패:`, error.message);
      }
    }
    console.log(`  ✅ ${challenges.length}개 Challenges 마이그레이션 완료\n`);

    // 5. Comments 마이그레이션
    console.log('📦 Comments 마이그레이션 중...');
    const comments = sqliteDb.prepare('SELECT * FROM Comment').all();
    for (const comment of comments) {
      try {
        await postgresPrisma.comment.upsert({
          where: { id: comment.id },
          update: {
            challengeId: comment.challengeId,
            promptId: comment.promptId,
            userId: comment.userId,
            content: comment.content,
            parentId: comment.parentId,
            createdAt: new Date(comment.createdAt),
            updatedAt: new Date(comment.updatedAt),
          },
          create: {
            id: comment.id,
            challengeId: comment.challengeId,
            promptId: comment.promptId,
            userId: comment.userId,
            content: comment.content,
            parentId: comment.parentId,
            createdAt: new Date(comment.createdAt),
            updatedAt: new Date(comment.updatedAt),
          },
        });
      } catch (error) {
        console.error(`  ❌ Comment ${comment.id} 마이그레이션 실패:`, error.message);
      }
    }
    console.log(`  ✅ ${comments.length}개 Comments 마이그레이션 완료\n`);

    // 6. ChatRooms 마이그레이션
    console.log('📦 ChatRooms 마이그레이션 중...');
    const chatRooms = sqliteDb.prepare('SELECT * FROM ChatRoom').all();
    for (const room of chatRooms) {
      try {
        await postgresPrisma.chatRoom.upsert({
          where: { id: room.id },
          update: {
            challengeId: room.challengeId,
            createdAt: new Date(room.createdAt),
            updatedAt: new Date(room.updatedAt),
          },
          create: {
            id: room.id,
            challengeId: room.challengeId,
            createdAt: new Date(room.createdAt),
            updatedAt: new Date(room.updatedAt),
          },
        });
      } catch (error) {
        console.error(`  ❌ ChatRoom ${room.id} 마이그레이션 실패:`, error.message);
      }
    }
    console.log(`  ✅ ${chatRooms.length}개 ChatRooms 마이그레이션 완료\n`);

    // 7. ChatMembers 마이그레이션
    console.log('📦 ChatMembers 마이그레이션 중...');
    const members = sqliteDb.prepare('SELECT * FROM ChatMember').all();
    for (const member of members) {
      try {
        await postgresPrisma.chatMember.upsert({
          where: { chatRoomId_userId: { chatRoomId: member.chatRoomId, userId: member.userId } },
          update: {
            role: member.role,
            experience: member.experience,
            isOwner: member.isOwner === 1 || member.isOwner === true,
            joinedAt: new Date(member.joinedAt),
          },
          create: {
            id: member.id,
            chatRoomId: member.chatRoomId,
            userId: member.userId,
            role: member.role,
            experience: member.experience,
            isOwner: member.isOwner === 1 || member.isOwner === true,
            joinedAt: new Date(member.joinedAt),
          },
        });
      } catch (error) {
        console.error(`  ❌ ChatMember ${member.id} 마이그레이션 실패:`, error.message);
      }
    }
    console.log(`  ✅ ${members.length}개 ChatMembers 마이그레이션 완료\n`);

    // 8. ChatMessages 마이그레이션
    console.log('📦 ChatMessages 마이그레이션 중...');
    const messages = sqliteDb.prepare('SELECT * FROM ChatMessage').all();
    for (const message of messages) {
      try {
        await postgresPrisma.chatMessage.upsert({
          where: { id: message.id },
          update: {
            chatRoomId: message.chatRoomId,
            userId: message.userId,
            content: message.content,
            fileUrl: message.fileUrl,
            fileName: message.fileName,
            fileType: message.fileType,
            createdAt: new Date(message.createdAt),
          },
          create: {
            id: message.id,
            chatRoomId: message.chatRoomId,
            userId: message.userId,
            content: message.content,
            fileUrl: message.fileUrl,
            fileName: message.fileName,
            fileType: message.fileType,
            createdAt: new Date(message.createdAt),
          },
        });
      } catch (error) {
        console.error(`  ❌ ChatMessage ${message.id} 마이그레이션 실패:`, error.message);
      }
    }
    console.log(`  ✅ ${messages.length}개 ChatMessages 마이그레이션 완료\n`);

    // 9. JoinRequests 마이그레이션
    console.log('📦 JoinRequests 마이그레이션 중...');
    const requests = sqliteDb.prepare('SELECT * FROM JoinRequest').all();
    for (const request of requests) {
      try {
        await postgresPrisma.joinRequest.upsert({
          where: { challengeId_userId: { challengeId: request.challengeId, userId: request.userId } },
          update: {
            role: request.role,
            experience: request.experience,
            status: request.status,
            createdAt: new Date(request.createdAt),
            updatedAt: new Date(request.updatedAt),
          },
          create: {
            id: request.id,
            challengeId: request.challengeId,
            userId: request.userId,
            role: request.role,
            experience: request.experience,
            status: request.status,
            createdAt: new Date(request.createdAt),
            updatedAt: new Date(request.updatedAt),
          },
        });
      } catch (error) {
        console.error(`  ❌ JoinRequest ${request.id} 마이그레이션 실패:`, error.message);
      }
    }
    console.log(`  ✅ ${requests.length}개 JoinRequests 마이그레이션 완료\n`);

    // 10. Notifications 마이그레이션
    console.log('📦 Notifications 마이그레이션 중...');
    const notifications = sqliteDb.prepare('SELECT * FROM Notification').all();
    for (const notification of notifications) {
      try {
        await postgresPrisma.notification.upsert({
          where: { id: notification.id },
          update: {
            userId: notification.userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            link: notification.link,
            isRead: notification.isRead === 1 || notification.isRead === true,
            createdAt: new Date(notification.createdAt),
          },
          create: {
            id: notification.id,
            userId: notification.userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            link: notification.link,
            isRead: notification.isRead === 1 || notification.isRead === true,
            createdAt: new Date(notification.createdAt),
          },
        });
      } catch (error) {
        console.error(`  ❌ Notification ${notification.id} 마이그레이션 실패:`, error.message);
      }
    }
    console.log(`  ✅ ${notifications.length}개 Notifications 마이그레이션 완료\n`);

    // 11. Events 마이그레이션
    console.log('📦 Events 마이그레이션 중...');
    const events = sqliteDb.prepare('SELECT * FROM Event').all();
    for (const event of events) {
      try {
        await postgresPrisma.event.upsert({
          where: { id: event.id },
          update: {
            chatRoomId: event.chatRoomId,
            userId: event.userId,
            title: event.title,
            description: event.description,
            startDate: new Date(event.startDate),
            endDate: event.endDate ? new Date(event.endDate) : null,
            color: event.color || '#3b82f6',
            createdAt: new Date(event.createdAt),
          },
          create: {
            id: event.id,
            chatRoomId: event.chatRoomId,
            userId: event.userId,
            title: event.title,
            description: event.description,
            startDate: new Date(event.startDate),
            endDate: event.endDate ? new Date(event.endDate) : null,
            color: event.color || '#3b82f6',
            createdAt: new Date(event.createdAt),
          },
        });
      } catch (error) {
        console.error(`  ❌ Event ${event.id} 마이그레이션 실패:`, error.message);
      }
    }
    console.log(`  ✅ ${events.length}개 Events 마이그레이션 완료\n`);

    // 12. Whiteboards 마이그레이션
    console.log('📦 Whiteboards 마이그레이션 중...');
    const whiteboards = sqliteDb.prepare('SELECT * FROM Whiteboard').all();
    for (const whiteboard of whiteboards) {
      try {
        await postgresPrisma.whiteboard.upsert({
          where: { id: whiteboard.id },
          update: {
            chatRoomId: whiteboard.chatRoomId,
            title: whiteboard.title,
            content: whiteboard.content,
            createdAt: new Date(whiteboard.createdAt),
            updatedAt: new Date(whiteboard.updatedAt),
          },
          create: {
            id: whiteboard.id,
            chatRoomId: whiteboard.chatRoomId,
            title: whiteboard.title,
            content: whiteboard.content,
            createdAt: new Date(whiteboard.createdAt),
            updatedAt: new Date(whiteboard.updatedAt),
          },
        });
      } catch (error) {
        console.error(`  ❌ Whiteboard ${whiteboard.id} 마이그레이션 실패:`, error.message);
      }
    }
    console.log(`  ✅ ${whiteboards.length}개 Whiteboards 마이그레이션 완료\n`);

    // 13. WhiteboardItems 마이그레이션
    console.log('📦 WhiteboardItems 마이그레이션 중...');
    const items = sqliteDb.prepare('SELECT * FROM WhiteboardItem').all();
    for (const item of items) {
      try {
        await postgresPrisma.whiteboardItem.upsert({
          where: { id: item.id },
          update: {
            whiteboardId: item.whiteboardId,
            type: item.type,
            content: item.content,
            position: item.position,
            size: item.size,
            style: item.style,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
          create: {
            id: item.id,
            whiteboardId: item.whiteboardId,
            type: item.type,
            content: item.content,
            position: item.position,
            size: item.size,
            style: item.style,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          },
        });
      } catch (error) {
        console.error(`  ❌ WhiteboardItem ${item.id} 마이그레이션 실패:`, error.message);
      }
    }
    console.log(`  ✅ ${items.length}개 WhiteboardItems 마이그레이션 완료\n`);

    // 14. GrowthTopics 마이그레이션
    console.log('📦 GrowthTopics 마이그레이션 중...');
    const topics = sqliteDb.prepare('SELECT * FROM GrowthTopic').all();
    for (const topic of topics) {
      try {
        await postgresPrisma.growthTopic.upsert({
          where: { id: topic.id },
          update: {
            userId: topic.userId,
            title: topic.title,
            description: topic.description,
            goal: topic.goal,
            level: topic.level,
            duration: topic.duration,
            startDate: new Date(topic.startDate),
            endDate: new Date(topic.endDate),
            status: topic.status || 'active',
            createdAt: new Date(topic.createdAt),
            updatedAt: new Date(topic.updatedAt),
          },
          create: {
            id: topic.id,
            userId: topic.userId,
            title: topic.title,
            description: topic.description,
            goal: topic.goal,
            level: topic.level,
            duration: topic.duration,
            startDate: new Date(topic.startDate),
            endDate: new Date(topic.endDate),
            status: topic.status || 'active',
            createdAt: new Date(topic.createdAt),
            updatedAt: new Date(topic.updatedAt),
          },
        });
      } catch (error) {
        console.error(`  ❌ GrowthTopic ${topic.id} 마이그레이션 실패:`, error.message);
      }
    }
    console.log(`  ✅ ${topics.length}개 GrowthTopics 마이그레이션 완료\n`);

    // 15. Curricula 마이그레이션
    console.log('📦 Curricula 마이그레이션 중...');
    const curricula = sqliteDb.prepare('SELECT * FROM Curriculum').all();
    for (const curriculum of curricula) {
      try {
        await postgresPrisma.curriculum.upsert({
          where: { topicId_dayNumber: { topicId: curriculum.topicId, dayNumber: curriculum.dayNumber } },
          update: {
            date: new Date(curriculum.date),
            title: curriculum.title,
            description: curriculum.description,
            objectives: curriculum.objectives,
            content: curriculum.content,
            exercises: curriculum.exercises,
            resources: curriculum.resources,
            estimatedTime: curriculum.estimatedTime || 60,
            createdAt: new Date(curriculum.createdAt),
            updatedAt: new Date(curriculum.updatedAt),
          },
          create: {
            id: curriculum.id,
            topicId: curriculum.topicId,
            dayNumber: curriculum.dayNumber,
            date: new Date(curriculum.date),
            title: curriculum.title,
            description: curriculum.description,
            objectives: curriculum.objectives,
            content: curriculum.content,
            exercises: curriculum.exercises,
            resources: curriculum.resources,
            estimatedTime: curriculum.estimatedTime || 60,
            createdAt: new Date(curriculum.createdAt),
            updatedAt: new Date(curriculum.updatedAt),
          },
        });
      } catch (error) {
        console.error(`  ❌ Curriculum ${curriculum.id} 마이그레이션 실패:`, error.message);
      }
    }
    console.log(`  ✅ ${curricula.length}개 Curricula 마이그레이션 완료\n`);

    // 16. LearningProgress 마이그레이션
    console.log('📦 LearningProgress 마이그레이션 중...');
    const progress = sqliteDb.prepare('SELECT * FROM LearningProgress').all();
    for (const prog of progress) {
      try {
        await postgresPrisma.learningProgress.upsert({
          where: { userId_topicId_dayNumber: { userId: prog.userId, topicId: prog.topicId, dayNumber: prog.dayNumber } },
          update: {
            date: new Date(prog.date),
            status: prog.status || 'not_started',
            timeSpent: prog.timeSpent || 0,
            notes: prog.notes,
            chatHistory: prog.chatHistory,
            completedAt: prog.completedAt ? new Date(prog.completedAt) : null,
            createdAt: new Date(prog.createdAt),
            updatedAt: new Date(prog.updatedAt),
          },
          create: {
            id: prog.id,
            userId: prog.userId,
            topicId: prog.topicId,
            dayNumber: prog.dayNumber,
            date: new Date(prog.date),
            status: prog.status || 'not_started',
            timeSpent: prog.timeSpent || 0,
            notes: prog.notes,
            chatHistory: prog.chatHistory,
            completedAt: prog.completedAt ? new Date(prog.completedAt) : null,
            createdAt: new Date(prog.createdAt),
            updatedAt: new Date(prog.updatedAt),
          },
        });
      } catch (error) {
        console.error(`  ❌ LearningProgress ${prog.id} 마이그레이션 실패:`, error.message);
      }
    }
    console.log(`  ✅ ${progress.length}개 LearningProgress 마이그레이션 완료\n`);

    // 17. SearchHistory 마이그레이션
    console.log('📦 SearchHistory 마이그레이션 중...');
    const searches = sqliteDb.prepare('SELECT * FROM SearchHistory').all();
    for (const search of searches) {
      try {
        await postgresPrisma.searchHistory.upsert({
          where: { id: search.id },
          update: {
            userId: search.userId,
            query: search.query,
            filters: search.filters,
            createdAt: new Date(search.createdAt),
          },
          create: {
            id: search.id,
            userId: search.userId,
            query: search.query,
            filters: search.filters,
            createdAt: new Date(search.createdAt),
          },
        });
      } catch (error) {
        console.error(`  ❌ SearchHistory ${search.id} 마이그레이션 실패:`, error.message);
      }
    }
    console.log(`  ✅ ${searches.length}개 SearchHistory 마이그레이션 완료\n`);

    // 18. Follows 마이그레이션
    console.log('📦 Follows 마이그레이션 중...');
    const follows = sqliteDb.prepare('SELECT * FROM Follow').all();
    for (const follow of follows) {
      try {
        await postgresPrisma.follow.upsert({
          where: { followerId_followingId: { followerId: follow.followerId, followingId: follow.followingId } },
          update: {
            createdAt: new Date(follow.createdAt),
          },
          create: {
            id: follow.id,
            followerId: follow.followerId,
            followingId: follow.followingId,
            createdAt: new Date(follow.createdAt),
          },
        });
      } catch (error) {
        console.error(`  ❌ Follow ${follow.id} 마이그레이션 실패:`, error.message);
      }
    }
    console.log(`  ✅ ${follows.length}개 Follows 마이그레이션 완료\n`);

    console.log('✅ 모든 데이터 마이그레이션 완료!');
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
    throw error;
  } finally {
    sqliteDb.close();
    await postgresPrisma.$disconnect();
  }
}

// 스크립트 실행
migrateData()
  .then(() => {
    console.log('\n🎉 마이그레이션이 성공적으로 완료되었습니다!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 마이그레이션 실패:', error);
    process.exit(1);
  });





