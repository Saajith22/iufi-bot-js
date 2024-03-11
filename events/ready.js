import chalk from "chalk";
import client from "../index.js";
import { drive } from "@googleapis/drive";
import fs from "fs";
import axios from "axios";

client.on("ready", async () => {
  console.log(chalk.green.bold("Bot is now online!!"));
  const drive_key = "AIzaSyD2jvkVaT-oYWU3zDNmaWOFdeuq3l9JgGA";

  const Drive = drive("v3");
  const getFiles = async (id) =>
    await Drive.files.list({
      q: `'${id}' in parents`,
      key: drive_key,
    });

  const folder = await getFiles("1anisU4fVJHf-MWi0BwbxX3DJw8XCxymt");
  const cats = ["common", "rare", "epic", "legendary", "mystic", "celestial"];
  const categories = folder.data.files.filter((c) =>
    cats.find((ct) => c.name.toLowerCase().includes(ct))
  );

  console.log(chalk.whiteBright.bold("Loading images...."));

  let total = 0;
  const idMaker = () => `${"0".repeat(5 - String(total).length)}${total}`;

  await Promise.all(
    categories.map(async (cat) => {
      let name = cat.name.toLowerCase();
      let target = "./images";
      if (name.startsWith("new")) target = "./newImages";
      console.log(chalk.greenBright(`» ${name}`));
      name = name.replace("new ", "");

      const folderName = `${target}/${name}`;
      if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName);

        const images = await getFiles(cat.id);
        return await Promise.all(
          images.data.files.map(async (img, i) => {
            try {
              const imgPath = `${folderName}/${name}-${i + 1}.jpg`;
              const imgStream = fs.createWriteStream(imgPath);

              const imgData = await axios.get(
                `https://drive.usercontent.google.com/u/0/uc?id=${img.id}&export=download`,
                {
                  responseType: "stream",
                }
              );

              imgData.data.pipe(imgStream);
              total++;

              const id = idMaker();
              return client.cards.set(id, {
                id,
                name: img.name,
                url: imgPath,
                type: name,
              });
            } catch (e) {
              console.log(chalk.red(`Failed to download - ${img.name}`));
              return null;
            }
          })
        );
      } else
        fs.readdirSync(folderName).forEach((img) => {
          ++total;
          const id = idMaker();
          client.cards.set(id, {
            id,
            name: img,
            url: `${folderName}/${img}`,
            type: name,
          });
        });
    })
  );

  console.log(chalk.blue.bold(`Images Successfully Loaded - ${total} Images`));

  //REMINDER EVENT
  const conv = {
    roll: "🎲",
    quiz: "💯",
    game: "🃏",
    daily: "📅",
  };

  setInterval(async () => {
    const users = await client.db
      .collection("users")
      .find({
        reminder: true,
      })
      .toArray();

    await Promise.all(
      users.map(async ({ userId, reminder }) => {
        const cooldown = client.db.collection("cooldown");
        const data = await cooldown.findOne({
          userId,
        });

        if (data) {
          data.cooldowns.forEach(async (c, i) => {
            if (c.time < Date.now()) {
              let copy = [...data.cooldowns];
              copy.splice(i, 1);

              console.log(c, i);

              await cooldown.updateOne(
                {
                  userId,
                },
                {
                  $set: {
                    cooldowns: copy,
                  },
                }
              );

              if (["luck", "speed"].includes(c.name) || !reminder) return;
              const user = await client.users.fetch(userId);
              await user
                .send(
                  `${conv[c.name] || ""} Your ${
                    c.name
                  } is ready! Join the server and roll now.`
                )
                .catch((e) => null);
            }
          });
        }
      })
    );
  }, 20000);
});
