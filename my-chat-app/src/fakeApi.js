// // api.js
// import { faker } from "@faker-js/faker";

// export const fakeApiFetchMessages = () => {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       const messages = Array.from({ length: 10000 }, (_, i) => {
//         const user = faker.helpers.arrayElement(["John", "Sam", "Joyce", "Jin"]);
//         return {
//           user,
//           text: faker.lorem.sentences(2),
//           time: faker.date.recent().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
//           avatar: users[user],
//         };
//       });
//       resolve(messages);
//     }, 1500);
//   });
// };
