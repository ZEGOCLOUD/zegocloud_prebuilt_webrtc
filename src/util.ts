// 生成token
export function generateToken(
  userID: string,
  roomID: string,
  userName: string
): Promise<{ token: string }> {
  if (process.env.REACT_APP_ENV === "test") {
    return fetch(
      `https://choui-prebuilt.herokuapp.com/access_token?userID=${userID}&userName=${userName}&roomID=${roomID}&expired_ts=7200`,
      {
        method: "GET",
      }
    ).then((res) => res.json());
  } else {
    return fetch("https://console-api.zegocloud.com/demo/prebuilt_token", {
      method: "POST",
      body: JSON.stringify({
        user_id: userID,
        room_id: roomID,
        user_name: userName,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }).then(async (res) => {
      const result = await res.json();
      return {
        token: result.data.token,
      };
    });
  }
}

export function randomID(len: number): string {
  let result = "";
  if (result) return result;
  var chars = "12345qwertyuiopasdfgh67890jklmnbvcxzMNBVCZXASDQWERTYHGFUIOLKJP",
    maxPos = chars.length,
    i;
  len = len || 5;
  for (i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return result;
}

export function getRandomName() {
  const names = [
    "Oliver",
    "Jake",
    "Noah",
    "James",
    "Jack",
    "Connor",
    "Liam",
    "John",
    "Harry",
    "Callum",
    "Mason",
    "Robert",
    "Jacob",
    "Jacob",
    "Jacob",
    "Michael",
    "Charlie",
    "Kyle",
    "William",
    "William",
    "Thomas",
    "Joe",
    "Ethan",
    "David",
    "George",
    "Reece",
    "Michael",
    "Richard",
    "Oscar",
    "Rhys",
    "Alexander",
    "Joseph",
    "James",
    "Charlie",
    "James",
    "Charles",
    "William",
    "Damian",
    "Daniel",
    "Thomas",
  ];

  return names[Math.round(Math.random() * names.length)];
}
