async function getUsers(offset = 0) {
    const res = await fetch("https://misskey.neos.love/api/users", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "i": process.env.MISSKEY_API_KEY,
            limit: 100,
            offset: offset,
        })
    })
    const json = await res.json()
    if (json.length > 1) {
        return json.concat(await getUsers(offset + 100))
    } else {
        return json
    }
}

async function createNote(str) {
    const res = await fetch("https://misskey.neos.love/api/notes/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "i": process.env.MISSKEY_API_KEY,
            text: str,
        })
    })
    const json = await res.json()
    return json
}

async function status() {
    const res = await fetch("https://misskey.neos.love/api/stats",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "i": process.env.MISSKEY_API_KEY,
            })
        })
    const json = await res.json()
    return json.originalNotesCount
}

async function getYesterdayNotesCount(user) {
    const res = await fetch("https://misskey.neos.love/api/charts/user/notes?limit=1&span=day&userId=" + user.id)
    const json = await res.json()
    return json.inc[0]
}

function sp(str, len) {
    return str + " ".repeat(len - str.length)
}

function spl(str, len) {
    let tmp = str.toString()
    return " ".repeat(len - tmp.length) + tmp
}

function truncateToThreeDecimalPlaces(number, divisor) {
    let result = number / divisor;
    result = Math.floor(result * 1000) / 1000;
    return result;
}

function getNotesPerDay(user) {
    const now = new Date()
    const createdAt = new Date(user.createdAt)
    const diff = now.getTime() - createdAt.getTime()
    const days = diff / 1000 / 60 / 60 / 24
    return truncateToThreeDecimalPlaces(user.notesCount, days)
}


const users = await getUsers()
const totalNotesCount = await status()
const sortNotesCount = users.sort((a, b) => {
    return b.notesCount - a.notesCount
})

const top10 = await Promise.all(sortNotesCount.slice(0, 9).map(async (user) => {
    return {
        id: user.id,
        username: user.username,
        notesCount: user.notesCount,
        notesPerDay: await getYesterdayNotesCount(user)
    }
}))

const maxUserNameLength = top10.reduce((prev, current) => {
    return Math.max(prev, current.username.length)
}, 0)


const now = new Date()

const text = `
${now.getFullYear()}/${now.getMonth()}/${now.getDate()} のノート数ランキング

${top10.map((user, index) => {
        return `${index + 1}位 ${sp(user.username, maxUserNameLength)} ${spl(user.notesCount, 6)} ${spl("+" + user.notesPerDay,4)} (${Math.round(user.notesCount / totalNotesCount * 100)}%)`
    }
).join("\n")}
`

const note = await createNote(text)



