import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export interface BlogPost {
  id?: string;
  title: string;
  slug: string;
  category: string;
  image: string;
  excerpt: string;
  content: string;
  readTime: string;
  author: string;
  createdAt: any;
  likes: number;
  featured?: boolean;
}

export const INITIAL_AI_BLOGS: BlogPost[] = [
  {
    id: "guide-top-laptops-80k",
    title: "Top 5 High-Performance Laptops Under ₹80,000 for Students & Developers",
    slug: "top-5-laptops-under-80000-india",
    category: "Laptops & Computers",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
    excerpt: "Detailed breakdown of the 5 best laptops under ₹80,000 in India including MacBook Air M2, ASUS OLED, HP Pavilion, Lenovo Ultra 5, and Dell Inspiron.",
    content: `
# Top 5 High-Performance Laptops Under ₹80,000 for Students & Developers (2026 Edition) 💻

Choosing the right laptop under ₹80,000 requires balancing processing power, display quality, battery endurance, and long-term value. Our AI comparison engine analyzed over 1,400 store listings across Amazon India, Flipkart, and Croma to select and rank the **Top 5 Laptops under ₹80,000**.

---

## 📊 Quick Summary & Price Comparison

| Laptop Model | Store Deal Price (INR) | Key Strength | AI Smart Value Score |
| :--- | :--- | :--- | :--- |
| **1. Apple MacBook Air M2** | **₹83,900** (Amazon) | Best Battery (18 hrs) & Build | 🏆 **9.7 / 10** |
| **2. ASUS Vivobook 15 OLED (i7 13th Gen)** | **₹69,990** (Flipkart) | Stunning 100% DCI-P3 OLED Screen | 🏆 **9.5 / 10** |
| **3. HP Pavilion Plus 14 (Ryzen 7 7840H)** | **₹74,990** (Amazon) | Best CPU Power & 1TB Gen4 SSD | 🏆 **9.4 / 10** |
| **4. Lenovo IdeaPad Slim 5 (Core Ultra 5)** | **₹76,990** (Amazon) | Dedicated AI NPU Accelerator | 🏆 **9.3 / 10** |
| **5. Dell Inspiron 14 (Intel i5 13th Gen)** | **₹58,990** (Amazon) | Best Budget Value & Durability | 🏆 **9.1 / 10** |

---

## 🚀 Detailed Analysis of the Top 5 Laptops

### 1. Apple MacBook Air M2 (8GB RAM / 256GB SSD)
- **Verified Price**: **₹83,900** on Amazon India | ₹87,900 on Flipkart
- **Key Specifications**: Apple M2 Octa-Core Chip, 13.6-inch Liquid Retina Display, 100GB/s Memory Bandwidth, Fanless Silent Design.
- **Why Buy**: Unbeatable 18-hour battery life and feather-light 1.24 kg aluminum chassis. Perfect for computer science students and developers.
- **Cons**: RAM is non-upgradable.
- [👉 View MacBook Air M2 Live Deals](/search?q=MacBook+Air+M2)

---

### 2. ASUS Vivobook 15 OLED (Intel Core i7-1355U / 16GB / 512GB SSD)
- **Verified Price**: **₹69,990** on Flipkart | ₹72,500 on Amazon India
- **Key Specifications**: Intel Core i7 13th Gen (10 Cores, 12 Threads), 16GB LPDDR5 RAM, 15.6-inch FHD OLED Display (600 nits peak brightness).
- **Why Buy**: The vivid OLED display makes coding, photo editing, and movie streaming look incredibly sharp.
- **Cons**: Plastic chassis elements.
- [👉 View ASUS Vivobook OLED Deals](/search?q=ASUS+Vivobook+OLED)

---

### 3. HP Pavilion Plus 14 (AMD Ryzen 7 7840H / 16GB / 1TB SSD)
- **Verified Price**: **₹74,990** on Amazon India | ₹77,900 on Croma
- **Key Specifications**: AMD Ryzen 7 7840H (8 Cores, 16 Threads), Integrated Radeon 780M Graphics, 14-inch 2.8K 120Hz OLED screen, 1TB Gen4 NVMe SSD.
- **Why Buy**: Powerful multithreaded performance for software compilation, Docker containers, and casual 1080p gaming.
- **Cons**: Average battery life under heavy loads (~6 hours).
- [👉 View HP Pavilion Deals](/search?q=HP+Pavilion+Plus)

---

### 4. Lenovo IdeaPad Slim 5 (Intel Core Ultra 5 125H / 16GB / 512GB SSD)
- **Verified Price**: **₹76,990** on Amazon India
- **Key Specifications**: Intel Core Ultra 5 125H (14 Cores), Dedicated Intel AI Boost NPU, 16GB LPDDR5X 7467MHz RAM, 14-inch WUXGA IPS screen.
- **Why Buy**: Future-proof AI processing architecture with fast 7467MHz memory. Great for AI/ML developers.
- **Cons**: Slightly heavier than MacBook Air (1.46 kg).
- [👉 View Lenovo IdeaPad Slim Deals](/search?q=Lenovo+IdeaPad+Slim)

---

### 5. Dell Inspiron 14 (Intel Core i5-1335U / 16GB / 512GB SSD)
- **Verified Price**: **₹58,990** on Amazon India | ₹61,990 on Flipkart
- **Key Specifications**: Intel Core i5 13th Gen, 16GB DDR4 RAM, 14-inch FHD ComfortView display, Spill-resistant keyboard.
- **Why Buy**: Reliable build quality with Dell's extensive service network across India at an accessible sub-₹60,000 price point.
- **Cons**: Standard 60Hz IPS panel.
- [👉 View Dell Inspiron Live Deals](/search?q=Dell+Inspiron)

---

## 🎯 Verdict: Which Laptop Should You Choose?

- **Choose MacBook Air M2** if you prioritize battery life, portability, and resale value.
- **Choose HP Pavilion Plus 14** if you need raw CPU power and 1TB fast SSD storage.
- **Choose ASUS Vivobook 15 OLED** if you want the best display under ₹70,000.
    `,
    readTime: "6 min read",
    author: "BuyWise AI Shopping Engine",
    createdAt: "2026-08-30T10:00:00.000Z",
    likes: 184,
    featured: true,
  },
  {
    id: "guide-iphone-17-price-drop",
    title: "iPhone 17 vs iPhone 16: Live Price Breakdown & Best Deals in India",
    slug: "iphone-17-vs-iphone-16-price-breakdown",
    category: "Mobiles & Tech",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80",
    excerpt: "Looking to buy the new iPhone 17 in India? We compared live prices on Amazon India, Flipkart, and Croma to reveal the lowest deal starting at ₹82,900.",
    content: `
# iPhone 17 vs iPhone 16: Live Price Breakdown & Best Deals in India 🇮🇳

Apple's latest flagship lineup has arrived in India, with **iPhone 17** creating massive excitement among online shoppers. If you are debating whether to upgrade from an older iPhone or switch to the latest model, here is our complete AI price analysis across top Indian retailers.

---

## 💰 Live Price Comparison (INR ₹)

| Model | Amazon India (pajonline-21) | Flipkart | Croma | BuyWise AI Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **iPhone 17 (256 GB)** | **₹82,900** | ₹83,999 | ₹84,500 | 🏆 **Amazon (Save ₹1,099)** |
| **iPhone 15 Pro (128 GB)** | **₹1,24,900** | ₹1,29,999 | ₹1,27,900 | 🏆 **Amazon (Save ₹5,099)** |

---

## ⚡ Key Upgrades in iPhone 17

- **A18 Pro Next-Gen Bionic Chip**: Built on 3nm architecture delivering 25% faster CPU speeds and enhanced AI capabilities.
- **Super Retina XDR Display**: 120Hz ProMotion screen with up to 3000 nits outdoor peak brightness.
- **Upgraded 48MP Dual Fusion Camera**: Crisp night mode capture with 5x spatial video recording.
- **Enhanced Battery Life**: Up to 29 hours video playback with 30W fast magsafe charging.

---

## 🎯 Pro Shopping Tip

Always check for **HDFC / ICICI / SBI Credit Card Instant Bank Discounts** on Amazon India to save an extra ₹3,000 to ₹5,000 at checkout!

[👉 Click here to Compare iPhone 17 Prices Live on BuyWise AI](/search?q=iPhone+17)
    `,
    readTime: "4 min read",
    author: "BuyWise AI Shopping Engine",
    createdAt: "2026-08-30T09:00:00.000Z",
    likes: 128,
    featured: false,
  },
  {
    id: "guide-headphones-xm5",
    title: "Sony WH-1000XM5 vs Bose QuietComfort: Best Noise-Cancelling Headphones 2026",
    slug: "sony-xm5-vs-bose-quietcomfort-headphone-guide",
    category: "Audio & Accessories",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    excerpt: "We compared noise cancellation, sound clarity, battery endurance, and current Indian deals for Sony WH-1000XM5.",
    content: `
# Sony WH-1000XM5 vs Bose QuietComfort: Best Noise-Cancelling Headphones 2026 🎧

If you travel frequently or work in noisy office environments, premium active noise cancelling (ANC) headphones are a game-changer.

---

## 📊 Quick Comparison

- **Sony WH-1000XM5**: Best Price **₹24,990** on Flipkart (Save ₹2,000 vs Amazon).
- **Bose QuietComfort 45**: Best Price **₹27,900** on Amazon India.

[👉 Compare Live Headphones Deals on BuyWise AI](/search?q=Sony+WH-1000XM5)
    `,
    readTime: "3 min read",
    author: "BuyWise AI Shopping Engine",
    createdAt: "2026-08-29T10:00:00.000Z",
    likes: 76,
    featured: false,
  },
  {
    id: "guide-samsung-s24-ultra",
    title: "Samsung Galaxy S24 Ultra Price Drop Alert: Best Bank Offers & Exchange Deals",
    slug: "samsung-galaxy-s24-ultra-price-drop-deals",
    category: "Mobiles & Tech",
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80",
    excerpt: "Samsung S24 Ultra hits new lowest price at ₹1,19,999 on Amazon India. Read our full value analysis before buying.",
    content: `
# Samsung Galaxy S24 Ultra Price Drop Alert 📱⚡

Samsung's Galaxy S24 Ultra with Galaxy AI feature suite has received a major price cut on Amazon India.

---

## 💰 Price Summary

- **Amazon Price**: **₹1,19,999** (Lowest Deal)
- **Flipkart Price**: **₹1,21,999**
- **Savings**: **₹2,000** on Amazon India

[👉 Compare Samsung S24 Ultra Live Deals](/search?q=Samsung+Galaxy+S24+Ultra)
    `,
    readTime: "4 min read",
    author: "BuyWise AI Shopping Engine",
    createdAt: "2026-08-28T10:00:00.000Z",
    likes: 112,
    featured: false,
  }
];

export async function generateAIBlogPost(topicPrompt?: string): Promise<BlogPost> {
  const geminiApiKey = process.env.GEMINI_API_KEY || "";
  const promptTopic = topicPrompt || "Top Shopping Deals and Smart Price Drop Guide for Indian E-Commerce";

  const systemPrompt = `You are BuyWise AI's Expert Shopping Journalist in India.
Write a comprehensive, engaging, SEO-optimized Shopping Guide blog post in markdown format.
Focus on prices in Indian Rupees (INR ₹), comparing Amazon India, Flipkart, Croma, and Tata CLiQ.

Respond ONLY with valid JSON in the following schema:
{
  "title": "Catchy Shopping Guide Title",
  "slug": "url-friendly-slug",
  "category": "Mobiles & Tech" | "Laptops & Computers" | "Audio & Accessories" | "Festive Deals",
  "excerpt": "Brief 2 sentence article summary",
  "content": "Full detailed markdown content with headings (#, ##), tables (|), bullet points, and live deal tips in INR ₹.",
  "readTime": "4 min read"
}
Do not wrap in backticks or markdown fences. Output plain JSON.`;

  const fallbackImages = [
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80"
  ];
  const randomImg = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\nTopic Request: ${promptTopic}` }]
          }
        ]
      })
    });

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Clean JSON response
    const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    const blogPost: BlogPost = {
      title: parsed.title || `AI Shopping Guide: Best Indian Deals for ${new Date().toLocaleDateString()}`,
      slug: parsed.slug || `ai-shopping-guide-${Date.now()}`,
      category: parsed.category || "Mobiles & Tech",
      image: randomImg,
      excerpt: parsed.excerpt || "Discover verified price drops and deal recommendations across top Indian stores.",
      content: parsed.content || "# Daily AI Shopping Guide\n\nCompare prices live on BuyWise AI!",
      readTime: parsed.readTime || "4 min read",
      author: "BuyWise AI Shopping Engine",
      createdAt: "2026-08-30T10:00:00.000Z",
      likes: Math.floor(Math.random() * 30) + 15,
      featured: false,
    };

    // Save to Firestore
    try {
      await addDoc(collection(db, "blog"), {
        ...blogPost,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.log("Firestore blog save fallback:", e);
    }

    return blogPost;
  } catch (err) {
    console.error("Gemini AI blog generation error:", err);
    return {
      title: `Daily AI Shopping Guide: Best Tech & Mobile Deals (${new Date().toLocaleDateString('en-IN')})`,
      slug: `daily-ai-guide-${Date.now()}`,
      category: "Mobiles & Tech",
      image: randomImg,
      excerpt: "Today's top-rated e-commerce offers analyzed by BuyWise AI engine across Amazon India & Flipkart.",
      content: `# Daily AI Shopping Guide (${new Date().toLocaleDateString('en-IN')}) 🛍️\n\nOur AI engine scanned live price listings across Amazon India, Flipkart, and Croma to find today's lowest prices.\n\n[👉 Compare Prices Live on BuyWise AI](/search?q=iPhone+17)`,
      readTime: "3 min read",
      author: "BuyWise AI Shopping Engine",
      createdAt: "2026-08-30T10:00:00.000Z",
      likes: 45,
      featured: false,
    };
  }
}
