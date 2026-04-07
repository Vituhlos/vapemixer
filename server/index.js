import { createApp } from './app.js';

const app = createApp();
const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`VapeMixer server running on port ${PORT}`);
});
