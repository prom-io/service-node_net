export const getRandomElement = <Type>(array: Type[]): Type => {
    const randomIndex = Math.floor(Math.random() * (array.length + 1));
    return array[randomIndex];
};
