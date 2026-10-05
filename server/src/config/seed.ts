import bcrypt from 'bcryptjs';
import { db, migrate } from './db.js';

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function seed() {
  migrate();
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number };
  if (userCount.c > 0) {
    console.log('Database already seeded, skipping.');
    return;
  }
  console.log('Seeding database...');

  const insertUser = db.prepare('INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, ?)');
  insertUser.run('Admin User', 'admin@rexcinemas.com', bcrypt.hashSync('password', 10), 1);
  insertUser.run('Regular User', 'user@example.com', bcrypt.hashSync('password', 10), 0);

  // Real catalog mirrored from VOX Cinemas Egypt (titles, ratings, synopses,
  // posters, release dates). Posters are downloaded locally (see README).
  const movies = [
    // ------------------------- NOW SHOWING -------------------------
    { title: 'Red Flag', description: "A flight attendant poses as a commercial captain to charm women. When he falls in love with Habiba, he decides to settle down. Due to tight flight shifts, he grants his father a power of attorney to execute the wedding contract — only to end up married to four women simultaneously! When his father suffers temporary amnesia, Hesham embarks on a race against time to untangle the three extra marriages before Habiba discovers the chaos.", duration: 'TBA', poster_path: 'vox-red-flag.jpg', trailer_url: '', genre: 'Comedy', rating: '12+', status: 'current', release_date: '2026-09-01' },
    { title: 'Resident Evil', description: "From the mind of visionary filmmaker Zach Cregger (Weapons, Barbarian) comes a thrilling — and terrifying — reinvention of the Resident Evil franchise. In an all-new story, Resident Evil follows Bryan (Austin Abrams), a medical courier who unwittingly finds himself in an action-packed, non-stop race for survival as one fateful, horrifying night collapses around him in chaos.", duration: 'TBA', poster_path: 'vox-resident-evil.jpg', trailer_url: '', genre: 'Horror', rating: '18+', status: 'current', release_date: '2026-09-18' },
    { title: 'Mahmoud El Tany', description: "When a polished, high-powered businessman and a quick-witted street hustler discover they share the same name, a bizarre twist of fate forces them to swap lives — leading to chaos, comedy, and an unexpected journey of self-discovery.", duration: 'TBA', poster_path: 'vox-mahmoud-el-tany.jpg', trailer_url: '', genre: 'Comedy', rating: '12+', status: 'current', release_date: '2026-07-01' },
    { title: 'Spider-Man: Brand New Day', description: "It's a BRAND NEW DAY for Peter Parker. Fighting crime full-time as Spider-Man in a world that doesn't remember him — and the pressure of seeing his old friends move on without him — sparks a change in Peter he may not have the power to control. But that transformation might also be the only thing that can stop a shocking new threat to the city and those he loves — a powerful villain no one can even see.", duration: 'TBA', poster_path: 'vox-spider-man.jpg', trailer_url: '', genre: 'Action', rating: '12+', status: 'current', release_date: '2026-07-31' },
    { title: 'The Odyssey', description: "Christopher Nolan's next film, The Odyssey, is a mythic action epic shot across the world using brand new IMAX film technology. The film brings Homer's foundational saga to IMAX film screens for the first time. Starring Matt Damon, Tom Holland, Anne Hathaway, Robert Pattinson, Lupita Nyong'o, Zendaya and Charlize Theron.", duration: '2h 52m', poster_path: 'vox-odyssey.jpg', trailer_url: '', genre: 'Adventure', rating: '16+', status: 'current', release_date: '2026-07-16' },
    { title: 'Insidious: Out Of The Further', description: "Having earned over $740 million at the global box office, the Insidious franchise returns with a new family and a terror that redefines what The Further is capable of. Gemma, a young mother raising her daughter in the house she grew up in, discovers she can travel into The Further, the purgatorial realm of lost souls. When something evil comes after her, Gemma discovers an ability that changes everything: she doesn't just enter The Further, she can bring what lives there back to the real world.", duration: 'TBA', poster_path: 'vox-insidious.jpg', trailer_url: '', genre: 'Horror', rating: '16+', status: 'current', release_date: '2026-08-21' },
    { title: 'Fall 2: Deadpoint', description: "Grieving her sister Shiloh's death, Jax Hunter bonds with Shiloh's bold friend Luce. They tackle Mount Kwan's dangerous plank walk in Thailand. When a rockslide traps them on a narrow plank 3000 feet up, Jax must face her fears to survive.", duration: 'TBA', poster_path: 'vox-fall-2.jpg', trailer_url: '', genre: 'Thriller', rating: '16+', status: 'current', release_date: '2026-09-04' },
    { title: 'Practical Magic 2', description: "Practical Magic 2 returns to a world steeped in moonlit mischief and powerful ancestral magic, as the Owens sisters must confront the dark curse that threatens to unravel their family once and for all in a must-see cinematic event of fun, magic and mayhem.", duration: 'TBA', poster_path: 'vox-practical-magic-2.jpg', trailer_url: '', genre: 'Romance', rating: '16+', status: 'current', release_date: '2026-09-18' },
    { title: 'El Gawahergy', description: "After being caught one too many times, Seif, a famous jeweler with a weakness for women, is forced to put his traditional male pride aside. When his strong-willed wife Yasmine insists on building a healthier and more balanced life together, the couple turns to a relationship counselor and embarks on an unconventional therapy program to save their marriage. Instead of bringing them closer, each step unleashes a new wave of hilarious chaos.", duration: 'TBA', poster_path: 'vox-el-gawahergy.jpg', trailer_url: '', genre: 'Comedy', rating: 'G', status: 'current', release_date: '2026-06-01' },
    { title: 'Tad and the Magic Lamp', description: "Oli, Tad's intrepid two-year-old daughter, has turned him into an overprotective father and Mummy feels sidelined. When they find the magic lamp in Buckingham Palace, Mummy asks it to travel back in time to Paititi, Peru, in 1502. Tad, Sara and the whole team will have to follow Mummy into the past, before he changes history… Their journey will take them from Peru to Greece, and deep into the Middle East, all the way to the cave of Ali Baba and the Forty Thieves.", duration: 'TBA', poster_path: 'vox-tad.jpg', trailer_url: '', genre: 'Animation', rating: 'G', status: 'current', release_date: '2026-08-01' },
    { title: 'Khali Balak Min Nafsik', description: "The story revolves around a couple who face numerous recurring disagreements and problems, leading them to a series of humorous and unexpected situations.\n\nStarring: Yasmin Abdulaziz, Ahmed El Sakka", duration: '1h 45m', poster_path: 'vox-khali-balak.jpg', trailer_url: '', genre: 'Comedy', rating: '12+', status: 'current', release_date: '2026-07-22' },
    { title: 'The Uprising', description: "In plague-ravaged 14th-Century England, a peasant triggers a rebellion against King Richard II and unintentionally becomes a legend of resistance.\n\nStarring: Jamie Bell, Andrew Garfield, Stephen Dillane", duration: '2h 10m', poster_path: 'vox-uprising.jpg', trailer_url: '', genre: 'Action', rating: '16+', status: 'current', release_date: '2026-09-10' },
    { title: 'Mutiny', description: "After his billionaire industrialist boss is murdered in front of him, Cole Reed is set up to take the fall for the crime — leaving him on the run as he works to uncover an international conspiracy.\n\nStarring: Jason Statham, Annabelle Wallis", duration: '1h 35m', poster_path: 'vox-mutiny.jpg', trailer_url: '', genre: 'Action', rating: '16+', status: 'current', release_date: '2026-08-20' },
    { title: 'Coyote VS Acme', description: "A story set in the ACME warehouse, the manufacturer of anything and everything used by the Looney Tunes characters.\n\nStarring: John Cena, Will Forte, Lana Condor", duration: '1h 40m', poster_path: 'vox-coyote.jpg', trailer_url: '', genre: 'Animation', rating: 'G', status: 'current', release_date: '2026-08-27' },
    { title: 'Paw Patrol: The Dino Movie', description: "After their ship gets caught in a mysterious storm, the PAW Patrol pups crash land on an uncharted tropical island filled with dinosaurs. When Mayor Humdinger inadvertently causes a huge, dormant volcano to erupt, the pups are thrown into a series of high-stakes, dino-sized rescues bigger than anything they've done before.\n\nStarring: McKenna Grace, Terry Crews", duration: '1h 30m', poster_path: 'vox-paw-patrol.jpg', trailer_url: '', genre: 'Animation', rating: 'G', status: 'current', release_date: '2026-08-13' },
    { title: 'Just Play Dead', description: "A criminal mastermind (Samuel L. Jackson) plans to fake his death for insurance money while framing his wife's lover. His wife (Eva Green) plots to kill him for real and take it all. Both race to outmaneuver each other in a deadly battle of wits.\n\nStarring: Eva Green, Samuel L. Jackson", duration: '1h 35m', poster_path: 'vox-just-play-dead.jpg', trailer_url: '', genre: 'Thriller', rating: '16+', status: 'current', release_date: '2026-09-17' },
    { title: 'Pressure', description: "In the tense 72 hours before D-Day, and with the fate of the free world hanging in the balance, Pressure follows General Dwight D. Eisenhower and Captain James Stagg as they face an impossible choice — launch the largest and most dangerous seaborne invasion in history or risk losing the war altogether.\n\nStarring: Andrew Scott, Kerry Condon, Brendan Fraser", duration: '1h 40m', poster_path: 'vox-pressure.jpg', trailer_url: '', genre: 'Drama', rating: 'PG12', status: 'current', release_date: '2026-09-17' },
    { title: 'The Weight', description: "Desperate to save what is left of his family, during the height of the Great Depression a battle-scarred veteran is hired to help smuggle a fortune in gold across 100 miles of impenetrable wilderness.\n\nStarring: Russell Crowe, Ethan Hawke", duration: '1h 55m', poster_path: 'vox-weight.jpg', trailer_url: '', genre: 'Action', rating: '12+', status: 'current', release_date: '2026-09-17' },
    { title: 'Avengers Endgame: Encore', description: "After the devastating events of Avengers: Infinity War (2018), the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos' actions and restore balance to the universe.\n\nStarring: Chris Hemsworth, Robert Downey Jr, Chris Evans", duration: '3h 1m', poster_path: 'vox-avengers-encore.jpg', trailer_url: '', genre: 'Action', rating: '12+', status: 'current', release_date: '2026-09-24' },
    { title: 'Avengers Endgame: Encore (Infinity Vision)', description: "Experience the Avengers finale in Infinity Vision. After the devastating events of Avengers: Infinity War (2018), the universe is in ruins, and the Avengers assemble once more to reverse Thanos' actions and restore balance to the universe.\n\nStarring: Chris Hemsworth, Robert Downey Jr, Chris Evans", duration: '3h 1m', poster_path: 'vox-avengers-infinity.jpg', trailer_url: '', genre: 'Action', rating: '12+', status: 'current', release_date: '2026-09-24' },
    // ------------------------- COMING SOON -------------------------
    { title: 'Heart of the Beast', description: "After a harrowing plane crash, Special Forces officer James Belmont (Brad Pitt) and his combat dog, Odin, find themselves stranded deep in the Alaskan wilderness. Together, they are forced into a brutal fight for survival against the elements.\n\nStarring: Brad Pitt, J.K Simmons, Anna Lambe", duration: 'TBA', poster_path: 'vox-heart-of-beast.jpg', trailer_url: '', genre: 'Adventure', rating: '18TC', status: 'coming_soon', release_date: '2026-09-24' },
    { title: 'The Smurfs Timeless Adventure Volume 2', description: "Join the Smurfs in a collection of fun-filled adventures packed with wild inventions, thrilling competitions, teamwork, and chaotic missions. From sports contests to hilarious encounters with Gargamel, the Smurfs discover that friendship and courage always save the day.", duration: 'TBA', poster_path: 'vox-smurfs-2.jpg', trailer_url: '', genre: 'Animation', rating: '18TC', status: 'coming_soon', release_date: '2026-09-24' },
    { title: 'Shish Dou', description: "A comedy-drama that unfolds over the course of a single night, exposing the fragility of different social classes. Two middle-aged friends reunited after years of hardship stumble upon Tarek, a wealthy young man unconscious after a fight, and impulsively decide to kidnap him for ransom. What begins as an amateur crime spirals into a chaotic and absurd situation.\n\nStarring: Bayyoumy Fouad, Bassem Samra", duration: 'TBA', poster_path: 'vox-shish-dou.jpg', trailer_url: '', genre: 'Comedy', rating: '18TC', status: 'coming_soon', release_date: '2026-09-24' },
    { title: 'Verity', description: "Adapted from Colleen Hoover's best-selling novel, this seductive psychological thriller follows renowned author Verity Crawford (Anne Hathaway) and Lowen Ashleigh (Dakota Johnson), a struggling writer who relocates to the remote Crawford estate to ghostwrite for Verity — and uncovers what appears to be Verity's chilling autobiographical notes.\n\nStarring: Anne Hathaway, Dakota Johnson, Josh Hartnett", duration: 'TBA', poster_path: 'vox-verity.jpg', trailer_url: '', genre: 'Thriller', rating: '18TC', status: 'coming_soon', release_date: '2026-10-01' },
    { title: 'The Dino Family', description: "Phil is an ordinary teenager whose life is overshadowed by personal failures and schoolyard teasing. Everything changes dramatically when he stumbles upon and accidentally opens a hidden portal to go back 65 million years.", duration: 'TBA', poster_path: 'vox-dino-family.jpg', trailer_url: '', genre: 'Animation', rating: '18TC', status: 'coming_soon', release_date: '2026-10-15' },
    { title: 'Whalefall', description: "Follows a scuba diver who, while looking for his father's remains, is swallowed by an 80-foot, 60-ton sperm whale and has just one hour to get out before his oxygen runs out.\n\nStarring: Elisabeth Shue, Josh Brolin", duration: 'TBA', poster_path: 'vox-whalefall.jpg', trailer_url: '', genre: 'Thriller', rating: '18TC', status: 'coming_soon', release_date: '2026-10-15' },
    { title: 'Sense and Sensibility', description: "Sense and Sensibility follows sisters Elinor and Marianne Dashwood as they navigate love, heartbreak and societal expectations after their family loses its estate. Despite their contrasting approaches to romance, their unbreakable bond carries them through loss and upheaval.\n\nStarring: Daisy Edgar-Jones, Caitriona Balfe", duration: 'TBA', poster_path: 'vox-sense.jpg', trailer_url: '', genre: 'Drama', rating: '18TC', status: 'coming_soon', release_date: '2026-10-15' },
    { title: 'Klara and the Sun', description: "Based on the bestselling novel from Nobel Prize-winner Kazuo Ishiguro: Klara (Jenna Ortega), an Artificial Friend who wants nothing more than to find the perfect home. When Klara meets Josie, each immediately senses a kindred spirit in the other — and Klara's innocent wonder begins to heal the family.\n\nStarring: Jenna Ortega, Amy Adams", duration: 'TBA', poster_path: 'vox-klara.jpg', trailer_url: '', genre: 'Sci-Fi', rating: '18TC', status: 'coming_soon', release_date: '2026-10-22' },
    { title: "BTS World Tour 'Arirang' in Buenos Aires: Live", description: "The first-ever BTS Live Viewing broadcast from South America. Experience the BTS World Tour 'Arirang' in cinemas worldwide, broadcasting from Buenos Aires, Argentina — the first time the band has ever performed in Argentina.", duration: 'TBA', poster_path: 'vox-bts-ba.jpg', trailer_url: '', genre: 'Documentary', rating: '18TC', status: 'coming_soon', release_date: '2026-10-25' },
    { title: 'The Mongoose', description: "Accused of a crime he didn't commit and with nothing to lose, a war hero (Liam Neeson) leads law enforcement on a cross-country car chase with the help of his brothers in arms and a sympathetic public rooting for his getaway.\n\nStarring: Liam Neeson, Marisa Tomei, Ving Rhames", duration: 'TBA', poster_path: 'vox-mongoose.jpg', trailer_url: '', genre: 'Action', rating: '18TC', status: 'coming_soon', release_date: '2026-10-29' },
    { title: "BTS World Tour 'Arirang' in Sao Paulo: Live", description: "Experience the BTS World Tour 'Arirang' in cinemas worldwide, broadcasting from Sao Paulo, Brazil — the grand finale of their Latin America tour, bringing the explosive energy of the packed stadium straight to the big screen.", duration: 'TBA', poster_path: 'vox-bts-sp.jpg', trailer_url: '', genre: 'Documentary', rating: '18TC', status: 'coming_soon', release_date: '2026-10-31' },
    { title: 'The Cat In The Hat', description: "In the wonderfully whimsical tradition of Dr. Seuss, The Cat in the Hat comes to the big screen in his animated theatrical feature film debut — an all-new, epic adventure with an edge, where mischief, magic and mayhem reign supreme.\n\nStarring: Bill Hader, Xochitl Gomez", duration: 'TBA', poster_path: 'vox-cat-hat.jpg', trailer_url: '', genre: 'Animation', rating: '18TC', status: 'coming_soon', release_date: '2026-11-05' },
    { title: 'Godzilla Minus Zero', description: "War reduced Japan to zero, and Godzilla plunged it into minus. Two years have passed since then, and the country has faced agonizing struggles to achieve recovery and finally reclaim its daily life.\n\nStarring: Minami Hamabe, Ryunosuke Kamiki", duration: 'TBA', poster_path: 'vox-godzilla.jpg', trailer_url: '', genre: 'Action', rating: '18TC', status: 'coming_soon', release_date: '2026-11-05' },
    { title: 'Wala Kan Ala El-Bal', description: "A young tour guide in Luxor accepts an unusual deal from a wealthy businessman: win over his daughter and help her forget her ex. But when things don't go quite as planned, Hassan finds himself caught in a comical series of unexpected situations — and a love story he never saw coming.\n\nStarring: Nour El Nabawy, Ashraf Abdel Baky", duration: 'TBA', poster_path: 'vox-wala-kan.jpg', trailer_url: '', genre: 'Comedy', rating: '18TC', status: 'coming_soon', release_date: '2026-11-12' },
    { title: 'Hexed', description: "An awkward teen and her Type-A mother learn her peculiarities might be magical powers, transforming their lives and revealing a hidden magical realm.\n\nStarring: Rashida Jones, Hailee Steinfeld, Stephen Fry", duration: 'TBA', poster_path: 'vox-hexed.jpg', trailer_url: '', genre: 'Animation', rating: '18TC', status: 'coming_soon', release_date: '2026-11-26' },
    { title: 'Violent Night 2', description: "If you're nice, you get presents from the Big Guy. If you're naughty, you get justice. When Santa forgets the true meaning of Christmas, he finds himself in the heart of a lively mall community in desperate need of his help — and must call in reinforcements from the one person no baddie wants to tangle with: Mrs. Claus.", duration: 'TBA', poster_path: 'vox-violent-night-2.jpg', trailer_url: '', genre: 'Action', rating: '18TC', status: 'coming_soon', release_date: '2026-12-04' },
    { title: 'Avengers: Doomsday', description: "Heroes from three different worlds must unite when they're thrust together to confront a catastrophic danger that could destroy everything they know.\n\nStarring: Chris Hemsworth, Robert Downey Jr, Chris Evans, Pedro Pascal", duration: 'TBA', poster_path: 'vox-doomsday.jpg', trailer_url: '', genre: 'Action', rating: '18TC', status: 'coming_soon', release_date: '2026-12-16' },
    { title: 'Children of Blood and Bone', description: "In the epic fantasy world of Orisha, a young woman goes on a quest to reclaim the magic that was violently stolen from her people. Directed by Gina Prince-Bythewood.\n\nStarring: Thuso Mbedu, Damson Idris, Amandla Stenberg, Viola Davis, Idris Elba", duration: 'TBA', poster_path: 'vox-children-blood-bone.jpg', trailer_url: '', genre: 'Adventure', rating: '18TC', status: 'coming_soon', release_date: '2027-01-14' },
  ];
  // Official YouTube trailers (studio uploads verified Sep 2026). Titles absent
  // here have no YouTube trailer — their pages use the no-trailer layout.
  const TRAILERS: Record<string, string> = {
    'Red Flag': 'https://www.youtube.com/watch?v=Z9xAzR5Owdw',
    'Mahmoud El Tany': 'https://www.youtube.com/watch?v=eU0f7FPZ2zA',
    'Khali Balak Min Nafsik': 'https://www.youtube.com/watch?v=DFwAnHFVGr4',
    'Shish Dou': 'https://www.youtube.com/watch?v=K69cgezvS5s',
    'The Dino Family': 'https://www.youtube.com/watch?v=oSXyB8q-uEI',
    'Hexed': 'https://www.youtube.com/watch?v=5iyoBI4Afx0',
    "BTS World Tour 'Arirang' in Buenos Aires: Live": 'https://www.youtube.com/watch?v=519rQlg1hRw',
    "BTS World Tour 'Arirang' in Sao Paulo: Live": 'https://www.youtube.com/watch?v=519rQlg1hRw',
    'Resident Evil': 'https://www.youtube.com/watch?v=UizmmO6Wavw',
    'Spider-Man: Brand New Day': 'https://www.youtube.com/watch?v=62bIsvRcPv0',
    'The Odyssey': 'https://www.youtube.com/watch?v=f_bKjZeJBBI',
    'Insidious: Out Of The Further': 'https://www.youtube.com/watch?v=jxU8FU3o75A',
    'Fall 2: Deadpoint': 'https://www.youtube.com/watch?v=_0A6Bcd02g8',
    'Practical Magic 2': 'https://www.youtube.com/watch?v=Ho10_4IX1jE',
    'El Gawahergy': 'https://www.youtube.com/watch?v=J9OLBQz21gc',
    'Tad and the Magic Lamp': 'https://www.youtube.com/watch?v=8-Bjo_rXCkM',
    'The Uprising': 'https://www.youtube.com/watch?v=ZVkrhHebz1Q',
    'Mutiny': 'https://www.youtube.com/watch?v=FKSdXH89jbo',
    'Coyote VS Acme': 'https://www.youtube.com/watch?v=H-43VeYGiPM',
    'Paw Patrol: The Dino Movie': 'https://www.youtube.com/watch?v=CS3_xLd2a2E',
    'Just Play Dead': 'https://www.youtube.com/watch?v=LlAajeOoFBo',
    'Pressure': 'https://www.youtube.com/watch?v=xcPgrKoXe_c',
    'The Weight': 'https://www.youtube.com/watch?v=7YpuMymmiJ8',
    'Avengers Endgame: Encore': 'https://www.youtube.com/watch?v=7pq7jlR0R6o',
    'Avengers Endgame: Encore (Infinity Vision)': 'https://www.youtube.com/watch?v=7pq7jlR0R6o',
    'Heart of the Beast': 'https://www.youtube.com/watch?v=YgHjBQ-q9Es',
    'Verity': 'https://www.youtube.com/watch?v=xdPMKhjMSFs',
    'Whalefall': 'https://www.youtube.com/watch?v=dlUjkIz5sdw',
    'Sense and Sensibility': 'https://www.youtube.com/watch?v=qc7vdHjVkLY',
    'Klara and the Sun': 'https://www.youtube.com/watch?v=wixzainceAE',
    'The Mongoose': 'https://www.youtube.com/watch?v=Gt935z2RdWU',
    'The Cat In The Hat': 'https://www.youtube.com/watch?v=jz8pLlPhSeY',
    'Godzilla Minus Zero': 'https://www.youtube.com/watch?v=0zrIMIcsT0k',
    'Violent Night 2': 'https://www.youtube.com/watch?v=FmM2giDwLAE',
    'Avengers: Doomsday': 'https://www.youtube.com/watch?v=irVNGjRFZGk',
    'Children of Blood and Bone': 'https://www.youtube.com/watch?v=4QYESVJkyuc',
  };
  const insertMovie = db.prepare(
    'INSERT INTO movies (title, description, duration, poster_path, trailer_url, genre, rating, status, release_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const movieIds: number[] = [];
  for (const m of movies) {
    const r = insertMovie.run(m.title, m.description, m.duration, m.poster_path, TRAILERS[m.title] ?? m.trailer_url, m.genre, m.rating, m.status, m.release_date);
    movieIds.push(Number(r.lastInsertRowid));
  }
  db.exec(`UPDATE movies SET language = 'Arabic' WHERE title IN (
    'Red Flag', 'Mahmoud El Tany', 'El Gawahergy', 'Khali Balak Min Nafsik', 'Shish Dou', 'Wala Kan Ala El-Bal'
  )`);
  db.exec(`UPDATE movies SET language = 'Japanese' WHERE title = 'Godzilla Minus Zero'`);

  const insertSeat = db.prepare('INSERT INTO seats (row, number, hall_id) VALUES (?, ?, ?)');
  const hallSeats = new Map<number, number[]>();
  const addSeats = (hallId: number, rows: string[], perRow: number) => {
    const ids: number[] = [];
    for (const row of rows) {
      for (let n = 1; n <= perRow; n++) {
        const r = insertSeat.run(row, n, hallId);
        ids.push(Number(r.lastInsertRowid));
      }
    }
    hallSeats.set(hallId, ids);
  };

  const insertCinema = db.prepare('INSERT INTO cinemas (name, city, address) VALUES (?, ?, ?)');
  const insertHall = db.prepare('INSERT INTO halls (cinema_id, name, format) VALUES (?, ?, ?)');
  const cinemaIds: number[] = [];
  const hallInfo: { id: number; format: string; cinema_id: number }[] = [];
  const locations = [
    { name: 'Mall of Egypt', city: 'Giza', address: 'El Wahat Road, Giza' },
    { name: 'City Centre Almaza', city: 'Cairo', address: 'Suez Road, Heliopolis, Cairo' },
    { name: 'City Centre Alexandria', city: 'Alexandria', address: 'Alexandria Desert Road' },
  ];
  const hallPlans = [
    { name: 'Standard Hall', format: 'Standard', rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], perRow: 10 },
    { name: 'IMAX Hall', format: 'IMAX', rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], perRow: 12 },
    { name: 'GOLD Lounge', format: 'GOLD', rows: ['A', 'B', 'C', 'D', 'E'], perRow: 8 },
  ];
  for (const loc of locations) {
    const c = insertCinema.run(loc.name, loc.city, loc.address);
    const cid = Number(c.lastInsertRowid);
    cinemaIds.push(cid);
    for (const plan of hallPlans) {
      const h = insertHall.run(cid, plan.name, plan.format);
      const hid = Number(h.lastInsertRowid);
      hallInfo.push({ id: hid, format: plan.format, cinema_id: cid });
      addSeats(hid, plan.rows, plan.perRow);
    }
  }

  const times = ['10:00', '12:30', '15:00', '17:30', '20:00', '22:30'];
  const insertShow = db.prepare('INSERT INTO showtimes (movie_id, hall_id, date, time) VALUES (?, ?, ?, ?)');
  const showIds: number[] = [];
  const showHall = new Map<number, number>();
  const currentIds = movieIds.slice(0, 20);
  // Each cinema programs its halls: the catalog is split across halls so every
  // movie plays somewhere (Standard takes the first block, IMAX/GOLD the rest)
  for (const cid of cinemaIds) {
    const halls = hallInfo.filter((h) => h.cinema_id === cid);
    halls.forEach((hall, hi) => {
      const perHall = Math.ceil(currentIds.length / halls.length);
      const programmed = currentIds.slice(hi * perHall, hi * perHall + perHall);
      for (const movieId of programmed) {
        for (let d = -2; d < 7; d++) {
          const count = 3 + Math.floor(Math.random() * 2);
          for (const t of times.slice(0, count)) {
            const r = insertShow.run(movieId, hall.id, todayPlus(d), t);
            const sid = Number(r.lastInsertRowid);
            showIds.push(sid);
            showHall.set(sid, hall.id);
          }
        }
      }
    });
  }

  const insertBooking = db.prepare(
    "INSERT INTO bookings (user_id, showtime_id, subtotal, booking_fee, tax_amount, total_price, status, payment_status, payment_method, transaction_id, booking_reference, check_in_token, paid_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const insertBS = db.prepare('INSERT INTO booking_seats (booking_id, seat_id) VALUES (?, ?)');
  const insertPayment = db.prepare(
    "INSERT INTO payments (booking_id, amount, payment_method, transaction_id, card_last_four, status) VALUES (?, ?, ?, ?, ?, 'completed')"
  );
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const ref = () => 'REX' + Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  for (let i = 0; i < 6; i++) {
    const userId = i % 2 === 0 ? 2 : 1;
    const showId = rand(showIds);
    const n = 1 + Math.floor(Math.random() * 3);
    const seatsInHall = hallSeats.get(showHall.get(showId)!) ?? [];
    const picked = [...seatsInHall].sort(() => Math.random() - 0.5).slice(0, n);
    const paid = i < 3;
    const subtotal = n * 12;
    const fee = 0;
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const chars2 = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const token = Array.from({ length: 24 }, () => chars2[Math.floor(Math.random() * chars2.length)]).join('');
    const total = Math.round((subtotal + fee + tax) * 100) / 100;
    const b = insertBooking.run(
      userId, showId, subtotal, fee, tax, total,
      paid ? 'confirmed' : rand(['pending', 'confirmed']),
      paid ? 'paid' : 'pending',
      paid ? rand(['credit_card', 'paypal']) : null,
      paid ? `TXN${Date.now()}${i}` : null,
      ref(),
      token,
      paid ? new Date().toISOString() : null
    );
    const bid = Number(b.lastInsertRowid);
    for (const s of picked) {
      try { insertBS.run(bid, s); } catch { /* ignore dup */ }
    }
    if (paid) insertPayment.run(bid, total, i % 2 ? 'paypal' : 'credit_card', `TXN${Date.now()}${i}`, i % 2 ? null : '4242');
  }

  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  insertSetting.run('site_name', 'REX Cinemas');
  insertSetting.run('contact_email', 'info@rexcinemas.com');
  insertSetting.run('phone_number', '+123 456 7890');
  insertSetting.run('address', 'Dubai, UAE');
  insertSetting.run('booking_fee', '0');
  insertSetting.run('tax_rate', '5');

  console.log('Seeding complete.');
}

/**
 * Demo self-healing: showtime seed data is date-relative, so an old database
 * eventually has no future showtimes ("No upcoming showtimes" everywhere).
 * When the schedule runs dry, regenerate the next 7 days from the current
 * catalog. Safe to run on every startup — a no-op when future shows exist.
 */
export function ensureFutureShowtimes() {
  const future = (db.prepare("SELECT COUNT(*) c FROM showtimes WHERE date >= date('now')").get() as { c: number }).c;
  if (Number(future) > 0) return;

  const movies = db.prepare("SELECT id FROM movies WHERE status = 'current' ORDER BY id").all() as { id: number }[];
  const halls = db.prepare('SELECT id, cinema_id FROM halls ORDER BY cinema_id, id').all() as { id: number; cinema_id: number }[];
  if (movies.length === 0 || halls.length === 0) return;

  const times = ['10:00', '12:30', '15:00', '17:30', '20:00', '22:30'];
  const ins = db.prepare('INSERT INTO showtimes (movie_id, hall_id, date, time) VALUES (?, ?, ?, ?)');
  const byCinema = new Map<number, number[]>();
  for (const h of halls) {
    const arr = byCinema.get(h.cinema_id) ?? [];
    arr.push(h.id);
    byCinema.set(h.cinema_id, arr);
  }
  const d = new Date();
  const iso = (off: number) => {
    const t = new Date(d);
    t.setDate(t.getDate() + off);
    return t.toISOString().slice(0, 10);
  };
  let created = 0;
  for (const [, hallIds] of byCinema) {
    const perHall = Math.ceil(movies.length / hallIds.length);
    hallIds.forEach((hallId, hi) => {
      for (const m of movies.slice(hi * perHall, hi * perHall + perHall)) {
        for (let day = 0; day < 7; day++) {
          for (const t of times.slice(0, 3)) {
            ins.run(m.id, hallId, iso(day), t);
            created++;
          }
        }
      }
    });
  }
  console.log(`Schedule was empty — generated ${created} showtimes for the next 7 days.`);
}
