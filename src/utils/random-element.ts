export const getRandomElement = <Type>(array: Type[]): Type => {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
};
