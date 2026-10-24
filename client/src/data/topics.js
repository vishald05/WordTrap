/**
 * Topics and Words Data
 * Reused from server/roomManager.js to ensure consistency across Online and Pass & Play modes.
 */

export const TOPICS = [
    { topic: "Fruits", words: ["Apple", "Mango", "Banana", "Orange", "Grape", "Watermelon", "Strawberry"] },
    { topic: "Animals", words: ["Tiger", "Elephant", "Dog", "Cat", "Lion", "Penguin", "Dolphin"] },
    { topic: "Countries", words: ["Japan", "Brazil", "France", "Egypt", "Canada", "Australia", "India"] },
    { topic: "Sports", words: ["Football", "Basketball", "Tennis", "Swimming", "Golf", "Cricket", "Boxing"] },
    { topic: "Vehicles", words: ["Car", "Airplane", "Bicycle", "Motorcycle", "Train", "Helicopter", "Boat"] },
    { topic: "Professions", words: ["Doctor", "Teacher", "Chef", "Pilot", "Firefighter", "Police", "Engineer"] },
    { topic: "Movies", words: ["Titanic", "Avatar", "Inception", "Frozen", "Jaws", "Matrix", "Rocky"] },
    { topic: "Food", words: ["Pizza", "Sushi", "Burger", "Pasta", "Taco", "Curry", "Sandwich"] }
];

export const MIN_PLAYERS = 4;

/**
 * Selects a random topic and word from that topic.
 * @returns {{ topic: string, word: string }}
 */
export function getRandomTopicAndWord() {
    const topicData = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    const word = topicData.words[Math.floor(Math.random() * topicData.words.length)];
    return {
        topic: topicData.topic,
        word: word
    };
}
