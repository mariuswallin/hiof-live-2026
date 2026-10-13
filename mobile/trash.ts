// // import av appwrite sin sdk
// // import av firebase sin sdk

// type Params = {
//   q?: string;
//   completed?: boolean;
//   limit?: number;
// };

// // {completed: true, q: "test"}
// export async function getTasks(params: Params) {
//   // https://test-losning/api/v1/tasks?completed=true&q=test
//   try {
//     const response = await fetch("https://test-losning/api/v1/tasks");
//     const data = await response.json();
//     // {ok: false, error: {code: 400, message: "Valideringsfeil", fieldErrors: {}}}
//     // {ok: true, data: [...]}
//     return data;
//   } catch (error) {
//     console.error(error);
//     return { ok: false, error: {} };
//   }
// }

// import { get } from "appwrite/sdk";

// export async function getTasks(params: Params) {
//   // https://test-losning/api/v1/tasks?completed=true&q=test
//   try {
//     const response = await get();
//     const data = await response.json();
//   } catch (error) {
//     console.error(error);
//     return { ok: false, error: {} };
//   }
// }
