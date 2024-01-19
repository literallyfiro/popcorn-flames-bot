import { MongoClient } from "npm:mongodb";
import env from "./env.ts";

export interface GroupData {
    _id: number;
    flameEnabled: boolean;
    lastPinnedMessageId?: number;
    flamers: { [userId: string]: number };
    flameStartedAt?: number;

    popcorns: {
        [type: string]: {
            emoji: string;
            takenTimes: number;
            takenBy?: number[];
        };
    }
}

const defaultPopcornTypes = {
    buttered: { emoji: "🍿", takenTimes: 0 },
    caramel: { emoji: "🍯", takenTimes: 0 },
    cheese: { emoji: "🧀", takenTimes: 0 },
    spicy: { emoji: "🌶️", takenTimes: 0 },
    sweet: { emoji: "🍬", takenTimes: 0 },
};

const client = new MongoClient(env["MONGO_URI"]);
await client.connect();
const db = client.db("popcorn");
const groups = db.collection<GroupData>("groups");

export async function fetchGroup(id: number): Promise<GroupData> {
    const group = await groups.findOne({ _id: id });
    if (!group) {
        await groups.insertOne({
            _id: id,
            flameEnabled: false,
            flamers: {},
            popcorns: defaultPopcornTypes,
        });
    }
    return group!;
}

export default groups;