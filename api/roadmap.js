const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DB_ID = process.env.NOTION_DATABASE_ID;

const STATUS_TO_COL = {
  'Suggested':   'suggested',
  'To Build':    'tobuild',
  'In Progress': 'inprogress',
  'Done':        'done',
};

const COL_TO_STATUS = {
  suggested:   'Suggested',
  tobuild:     'To Build',
  inprogress:  'In Progress',
  done:        'Done',
};

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const response = await notion.databases.query({ database_id: DB_ID });
    const cards = response.results.map(page => ({
      id:       page.id,
      name:     page.properties.Name?.title?.[0]?.plain_text ?? '(untitled)',
      desc:     page.properties.Description?.rich_text?.[0]?.plain_text ?? '',
      priority: (page.properties.Priority?.select?.name ?? 'Medium').toLowerCase(),
      status:   STATUS_TO_COL[page.properties.Status?.select?.name] ?? 'tobuild',
    }));
    return res.json(cards);
  }

  if (req.method === 'PATCH') {
    const { id, status } = req.body;
    const notionStatus = COL_TO_STATUS[status];
    if (!notionStatus) return res.status(400).json({ error: 'Invalid status' });
    await notion.pages.update({
      page_id: id,
      properties: { Status: { select: { name: notionStatus } } },
    });
    return res.json({ ok: true });
  }

  res.status(405).end();
};
