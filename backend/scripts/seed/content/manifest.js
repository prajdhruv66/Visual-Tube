export const VIEWERS = [
    { fullname: "Anil Kumar", username: "viewer_anil" },
    { fullname: "Sunita Sharma", username: "viewer_sunita" },
    { fullname: "Ramesh Patel", username: "viewer_ramesh" },
    { fullname: "Geeta Verma", username: "viewer_geeta" },
    { fullname: "Sanjay Gupta", username: "viewer_sanjay" },
    { fullname: "Rekha Joshi", username: "viewer_rekha" },
    { fullname: "Arvind Rao", username: "viewer_arvind" },
    { fullname: "Preeti Singh", username: "viewer_preeti" },
    { fullname: "Manish Nair", username: "viewer_manish" },
    { fullname: "Divya Sen", username: "viewer_divya" }
];

export const CONTENT_MANIFEST = [
    {
        category: "Programming / Backend / Frontend",
        creatorNames: ["Amit Kumar", "Neha Verma"],
        topics: [
            {
                title: "JavaScript ES6+ Best Practices",
                description: "A deep dive into clean coding patterns in JavaScript, using ES6 features, arrow functions, and modules.",
                tags: ["javascript", "programming", "clean-code"],
                thumbnailSearchKeywords: ["developer coding", "programming monitor"],
                videoSearchKeywords: ["developer coding VS Code", "keyboard typing code"],
                playlistName: "Modern JS Course",
                commentTemplates: ["Best JS video ever!", "Helped me understand scopes.", "Make a TypeScript one next!"]
            }
        ]
    },
    {
        category: "MongoDB",
        creatorNames: ["Sandeep Gupta", "Rahul Sharma"],
        topics: [
            {
                title: "MongoDB Indexing for Performance",
                description: "How to use single, compound, and text indexes to speed up read operations in MongoDB.",
                tags: ["mongodb", "database", "backend"],
                thumbnailSearchKeywords: ["database server room", "data structure"],
                videoSearchKeywords: ["database developer", "backend coding"],
                playlistName: "MongoDB Masterclass",
                commentTemplates: ["Indexing makes so much sense now.", "Excellent performance tips.", "Can you cover replica sets?"]
            }
        ]
    },
    {
        category: "Node.js",
        creatorNames: ["Priyanka Sen", "Rajesh Pillai"],
        topics: [
            {
                title: "Node.js Event Loop Deep Dive",
                description: "Understanding microtasks, timers, poll phase, and write operations in Node.js runtime.",
                tags: ["nodejs", "backend", "javascript"],
                thumbnailSearchKeywords: ["terminal screen", "code terminal"],
                videoSearchKeywords: ["JavaScript developer", "terminal typing"],
                playlistName: "Node.js Under the Hood",
                commentTemplates: ["The event loop diagram was great.", "Highly advanced topics, loved it.", "Subbed!"]
            }
        ]
    },
    {
        category: "Express",
        creatorNames: ["Priya Patel", "Vikram Shah"],
        topics: [
            {
                title: "Building Secure Express Middleware",
                description: "How to write global error handlers and custom security middlewares in Express.js.",
                tags: ["express", "nodejs", "backend", "middleware"],
                thumbnailSearchKeywords: ["computer system locks", "code shield"],
                videoSearchKeywords: ["backend developer", "developer coding VS Code"],
                playlistName: "Express Security Suite",
                commentTemplates: ["Excellent security practices.", "I will use this middleware in my project.", "Simple and clear!"]
            }
        ]
    },
    {
        category: "Redis",
        creatorNames: ["Nisha Roy", "Rohan Mehta"],
        topics: [
            {
                title: "Redis Caching Strategies",
                description: "Learn how to implement cache-aside, cache-through, and eviction policies using Redis in Node.js.",
                tags: ["redis", "caching", "backend", "system-design"],
                thumbnailSearchKeywords: ["cloud server virtualization", "speed cache"],
                videoSearchKeywords: ["backend engineer", "cloud server"],
                playlistName: "Redis Cache Masterclass",
                commentTemplates: ["My API response time went from 300ms to 5ms!", "Awesome caching guide.", "Loved it."]
            }
        ]
    },
    {
        category: "Docker",
        creatorNames: ["Isha Desai", "Karan Joshi"],
        topics: [
            {
                title: "Dockerizing Multi-Container Apps",
                description: "Learn to build multi-container local deployments using Docker Compose and Docker network bridges.",
                tags: ["docker", "devops", "containers", "yaml"],
                thumbnailSearchKeywords: ["shipping containers dock", "docker logo"],
                videoSearchKeywords: ["DevOps server racks", "terminal typing command line"],
                playlistName: "DevOps Toolbox",
                commentTemplates: ["Finally docker-compose is explained easily.", "Clean containerization tutorial.", "Perfect guide."]
            }
        ]
    },
    {
        category: "AI",
        creatorNames: ["Aarav Joshi", "Ananya Shah"],
        topics: [
            {
                title: "Intro to Neural Networks & Deep Learning",
                description: "An intuitive explanation of weights, biases, neural layers, and activation functions in AI.",
                tags: ["ai", "neural-network", "ml", "deep-learning"],
                thumbnailSearchKeywords: ["ai brain glowing", "cybernetic network"],
                videoSearchKeywords: ["artificial intelligence", "ML engineer"],
                playlistName: "AI Academy",
                commentTemplates: ["Backpropagation explained visually, thank you!", "Best AI intro video.", "Amazing graphics."]
            }
        ]
    },
    {
        category: "Cyber Security",
        creatorNames: ["Saurabh Rao", "Vikram Chopra"],
        topics: [
            {
                title: "Understanding Penetration Testing",
                description: "A beginner friendly guide to testing system defenses, scanning ports, and analyzing firewall vulnerabilities.",
                tags: ["security", "cybersecurity", "hacking", "firewall"],
                thumbnailSearchKeywords: ["hacker dark room laptop", "digital secure key padlock"],
                videoSearchKeywords: ["cybersecurity analyst", "firewall configuration screen"],
                playlistName: "Ethical Hacking Series",
                commentTemplates: ["Highly educational, thank you.", "Securing my local ports now.", "Outstanding guide."]
            }
        ]
    },
    {
        category: "Science",
        creatorNames: ["Sneha Malhotra", "Ajay Trivedi"],
        topics: [
            {
                title: "Chemical Reaction Rates & Kinetics",
                description: "Exploring collision theory, activation energy, and how catalysts speed up molecular transformations.",
                tags: ["science", "chemistry", "kinetics", "lab"],
                thumbnailSearchKeywords: ["chemistry flask colorful liquid", "molecular structure atomic model"],
                videoSearchKeywords: ["laboratory research", "chemistry experiment beakers"],
                playlistName: "General Chemistry",
                commentTemplates: ["Helped me prep for my exam!", "Very clear explanation of catalysts.", "Love chemistry!"]
            }
        ]
    },
    {
        category: "Space",
        creatorNames: ["Karan Kapoor", "Isha Bhatt"],
        topics: [
            {
                title: "Cosmic Accretion Disks of Black Holes",
                description: "Deconstructing gravity, glowing gas spirals, event horizons, and how black holes generate massive cosmic energy.",
                tags: ["space", "astronomy", "blackhole", "cosmos"],
                thumbnailSearchKeywords: ["black hole space accretion disk", "galaxy nebula view"],
                videoSearchKeywords: ["galaxy telescope space", "ISS space views station orbit"],
                playlistName: "AstroPhysics Guide",
                commentTemplates: ["Beautiful accretion disk visuals.", "Cosmology is fascinating.", "Captivating content."]
            }
        ]
    },
    {
        category: "Travel",
        creatorNames: ["Riya Gupta", "Nikhil Trivedi"],
        topics: [
            {
                title: "Exploring Scenic Spots in Goa",
                description: "Travel guide showcasing South Goa beaches, waterfalls, fort sites, and local cuisine spots.",
                tags: ["travel", "goa", "india", "beach", "guide"],
                thumbnailSearchKeywords: ["goa beach ocean sunset palm", "beach waves shore"],
                videoSearchKeywords: ["Goa beach coastal drone", "Paris travel highlights street view"],
                playlistName: "Coastal India Guides",
                commentTemplates: ["Planning my Goa trip now!", "South Goa is paradise.", "Fabulous beach drone shots."]
            }
        ]
    },
    {
        category: "Nature",
        creatorNames: ["Meera Bose", "Nitin Nair"],
        topics: [
            {
                title: "Breathtaking Forest & Alpine Trails",
                description: "A relaxing stroll through alpine forests, streams, valleys, and blooming mountain meadows.",
                tags: ["nature", "forest", "hiking", "meadows", "mountains"],
                thumbnailSearchKeywords: ["green pine forest mountains", "flowing river forest rocks"],
                videoSearchKeywords: ["forest waterfalls streams", "mountains meadows wind blowing"],
                playlistName: "Earthly Escapes",
                commentTemplates: ["So peaceful and relaxing.", "I need to go hiking soon.", "Nature is healing."]
            }
        ]
    },
    {
        category: "Wildlife",
        creatorNames: ["Sanjeev Shah", "Pooja Kapoor"],
        topics: [
            {
                title: "Tigers in their Natural Savanna Habitat",
                description: "A close look at hunting skills, family structure, and conservation efforts for Bengal Tigers.",
                tags: ["wildlife", "animals", "tiger", "safari"],
                thumbnailSearchKeywords: ["bengal tiger forest close", "african lion savanna"],
                videoSearchKeywords: ["tiger walking forest", "elephant savanna safari"],
                playlistName: "African & Indian Safaris",
                commentTemplates: ["Tigers are so majestic.", "Incredible predator footage.", "Support animal conservation!"]
            }
        ]
    },
    {
        category: "Food Blogging",
        creatorNames: ["Anita Roy", "Aditya Joshi"],
        topics: [
            {
                title: "Simmering Indian Street Food Recipes",
                description: "A cooking tutorial on rich samosa fillings, mint chutney, and spiced chickpea curries.",
                tags: ["food", "cooking", "streetfood", "recipe"],
                thumbnailSearchKeywords: ["indian street food samosa chat", "cooking spices pan close"],
                videoSearchKeywords: ["street food cooking market", "chef cooking kitchen skillet close"],
                playlistName: "Indian Street Delights",
                commentTemplates: ["Looks delicious!", "I will cook this tonight.", "Spiciness is perfect."]
            }
        ]
    },
    {
        category: "Fitness",
        creatorNames: ["Kavya Nair", "Ramesh Sen"],
        topics: [
            {
                title: "HIIT Workout Routine for Weight Loss",
                description: "A 15-minute high intensity interval training program requiring zero equipment. Perfect for home workouts.",
                tags: ["fitness", "hiit", "workout", "cardio"],
                thumbnailSearchKeywords: ["athlete sweating exercise gym", "fit woman doing pushup"],
                videoSearchKeywords: ["gym workout training", "man running track gym"],
                playlistName: "Home Cardio Suite",
                commentTemplates: ["Drenched in sweat! Great exercise.", "Love no-equipment routines.", "Keep uploading!"]
            }
        ]
    },
    {
        category: "Business",
        creatorNames: ["Arjun Rao", "Diya Pillai"],
        topics: [
            {
                title: "SaaS Startups: Metrics and Calculations",
                description: "How to calculate churn rate, LTV, CAC, and MRR metrics to scale SaaS software startups.",
                tags: ["business", "saas", "startups", "metrics"],
                thumbnailSearchKeywords: ["business metrics growth chart", "boardroom layout whiteboard"],
                videoSearchKeywords: ["startup office brainstorming", "office meeting coworkers"],
                playlistName: "Business Playbook",
                commentTemplates: ["SaaS metrics finally explained clearly.", "Very useful math guidelines.", "Awesome presentation."]
            }
        ]
    },
    {
        category: "Finance",
        creatorNames: ["Anil Bose", "CarryMinati Gaming"],
        topics: [
            {
                title: "SIP Mutual Fund Investing Guide",
                description: "An index fund and systematic investment plan guide to compound wealth steadily.",
                tags: ["finance", "investing", "sip", "stocks"],
                thumbnailSearchKeywords: ["rupee coins stack plant growth", "financial stock chart screen"],
                videoSearchKeywords: ["stock market screen check", "counting paper money close"],
                playlistName: "Personal Finance",
                commentTemplates: ["Compounding interest is amazing.", "SIPs are the safest way.", "Great tutorial!"]
            }
        ]
    },
    {
        category: "Photography",
        creatorNames: ["Mortal", "Scout"],
        topics: [
            {
                title: "Landscape Photography: Composition Rules",
                description: "Learn how to use rule of thirds, leading lines, and golden hour lighting in landscape photos.",
                tags: ["photography", "camera", "settings", "landscape"],
                thumbnailSearchKeywords: ["camera tripod golden hour mountain", "photographer landscape sunset"],
                videoSearchKeywords: ["camera lens focus zoom ring", "photographer taking picture mountain"],
                playlistName: "Photo School",
                commentTemplates: ["Rule of thirds explanation was top notch.", "Beautiful photos.", "Helped my manual focus skill."]
            }
        ]
    },
    {
        category: "Gaming",
        creatorNames: ["Rajeev Masand", "Sucharita Sen"],
        topics: [
            {
                title: "Elden Ring RPG Strategy Breakdown",
                description: "Defeating hard boss battles using hybrid character stats and parry timings.",
                tags: ["gaming", "eldenring", "bossguide", "rpg"],
                thumbnailSearchKeywords: ["gaming controller neon glow", "dark fantasy concept art"],
                videoSearchKeywords: ["gaming setup monitor keyboard mouse", "esports tournament screen player"],
                playlistName: "RPG Combat Guides",
                commentTemplates: ["This boss guide saved my controller!", "Subscribed immediately.", "Best dodge guide."]
            }
        ]
    },
    {
        category: "Movie Reviews",
        creatorNames: ["Anupama Chopra", "Aditya Birla"],
        topics: [
            {
                title: "Interstellar Cinematic Analysis",
                description: "Explaining the physics, emotional timelines, and wormhole effects in Nolan's film.",
                tags: ["movies", "interstellar", "review", "nolan"],
                thumbnailSearchKeywords: ["cinematic space movie poster", "projector glow reel close"],
                videoSearchKeywords: ["cinema theater audience screen", "movie reviewer desk editing"],
                playlistName: "Nolan Movie Reviews",
                commentTemplates: ["The Zimmer soundtrack review was so good.", "Brings back memories.", "Spot on movie analysis."]
            }
        ]
    },
    {
        category: "History",
        creatorNames: ["Karan Singhal", "Vijay Mallya"],
        topics: [
            {
                title: "The Urban Planning of Harappa",
                description: "Exploring urban grids, clay seals, public baths, and sanitation of the Indus Valley Civilization.",
                tags: ["history", "ancient", "archaeology", "indus-valley"],
                thumbnailSearchKeywords: ["ancient ruins clay artifacts", "historic monument ruins"],
                videoSearchKeywords: ["museum historical monuments", "archaeology site scan camera"],
                playlistName: "Ancient Foundations",
                commentTemplates: ["Advanced sanitation tech for 2500 BC!", "Top historic scripting.", "Loved Harappa details."]
            }
        ]
    },
    {
        category: "News",
        creatorNames: ["Rahul Goel", "Anjali Bansal"],
        topics: [
            {
                title: "Reporting on Global Container Shortages",
                description: "How shipping backlogs and port congestion spike consumer price inflation around the world.",
                tags: ["news", "shipping", "supplychain", "economy"],
                thumbnailSearchKeywords: ["shipping container harbor cranes", "news anchor newsroom"],
                videoSearchKeywords: ["newsroom reporter broadcast camera", "harbor cargo terminal unloading"],
                playlistName: "Economic Reports",
                commentTemplates: ["Excellent reporting on logistics.", "Highly analytical news segment.", "Compelling details."]
            }
        ]
    },
    {
        category: "Sports",
        creatorNames: ["Pranav Shah", "Vikram Rathore"],
        topics: [
            {
                title: "Cricket: Perfecting the Cover Drive",
                description: "An analysis of footing, wrist roll, and balance to play the classical cover drive.",
                tags: ["sports", "cricket", "batting", "coaching"],
                thumbnailSearchKeywords: ["cricket ball stadium turf grass", "batsman batting crease play"],
                videoSearchKeywords: ["cricket nets practice session", "sports training stadium player close"],
                playlistName: "Cricket Batting School",
                commentTemplates: ["Kohli's balance is just incredible.", "Excellent batting tutorials.", "Super cricket tips."]
            }
        ]
    },
    {
        category: "Lifestyle",
        creatorNames: ["Shalini Singh", "Abhishek Goel"],
        topics: [
            {
                title: "Minimalist Coffee Shop Workspace Setup",
                description: "A quiet morning setup focusing on laptop workflow, journaling, and minimal gear layouts.",
                tags: ["lifestyle", "workspace", "minimalism", "productivity"],
                thumbnailSearchKeywords: ["coffee cup workspace window sun", "minimalist room decor desk"],
                videoSearchKeywords: ["coffee shop workspace laptop cup", "pouring coffee cup kitchen mug"],
                playlistName: "Mindful Workspace Habits",
                commentTemplates: ["So cozy and satisfying.", "Perfect study playlist music.", "Inspiring workflow."]
            }
        ]
    },
    {
        category: "Automobiles",
        creatorNames: ["Ranveer Allahbadia", "Prajakta Koli"],
        topics: [
            {
                title: "Brushless Motors in Electric Cars",
                description: "How electric car drivetrains distribute torque compared to internal combustion engines.",
                tags: ["ev", "engineering", "automotive", "motors"],
                thumbnailSearchKeywords: ["electric car charging plug connector", "sports car dynamic front"],
                videoSearchKeywords: ["sports car highway driving", "automobile manufacturing machinery"],
                playlistName: "EV Power Grid",
                commentTemplates: ["Brushless torque curves are insane.", "Excellent EV motor graphics.", "Informative!"]
            }
        ]
    }
];
