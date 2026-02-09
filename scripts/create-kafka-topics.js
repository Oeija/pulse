const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'topic-creator',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092']
});

const admin = kafka.admin();

const topics = [
  {
    topic: 'api-metrics',
    numPartitions: 3,
    replicationFactor: 1,
    configEntries: [
      { name: 'retention.ms', value: '604800000' } // 7 days
    ]
  },
  {
    topic: 'database-metrics',
    numPartitions: 3,
    replicationFactor: 1,
    configEntries: [
      { name: 'retention.ms', value: '604800000' } // 7 days
    ]
  },
  {
    topic: 'business-events',
    numPartitions: 3,
    replicationFactor: 1,
    configEntries: [
      { name: 'retention.ms', value: '2592000000' } // 30 days
    ]
  }
];

async function createTopics() {
  try {
    console.log('Connecting to Kafka...');
    await admin.connect();
    console.log('Connected to Kafka');

    // List existing topics
    const existingTopics = await admin.listTopics();
    console.log('Existing topics:', existingTopics);

    // Filter out topics that already exist
    const topicsToCreate = topics.filter(
      t => !existingTopics.includes(t.topic)
    );

    if (topicsToCreate.length === 0) {
      console.log('All topics already exist. Nothing to create.');
      return;
    }

    console.log(`Creating ${topicsToCreate.length} topics...`);
    const result = await admin.createTopics({
      topics: topicsToCreate,
      waitForLeaders: true
    });

    if (result) {
      console.log('Topics created successfully:');
      topicsToCreate.forEach(t => {
        console.log(`  - ${t.topic} (${t.numPartitions} partitions, ${t.configEntries[0].value}ms retention)`);
      });
    } else {
      console.log('Topics may already exist or creation failed');
    }

    // Verify topics were created
    const updatedTopics = await admin.listTopics();
    console.log('\nAll topics:', updatedTopics);

  } catch (error) {
    console.error('Error creating topics:', error);
    process.exit(1);
  } finally {
    await admin.disconnect();
    console.log('\nDisconnected from Kafka');
  }
}

createTopics();
