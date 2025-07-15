# SILK Homes Website

**Live Site:** [silkhomes.org](https://silkhomes.org)

SILK Homes is a community-focused hospitality network operating historic properties in West Virginia and Ohio. Our website serves as the digital gateway to our intentional living community, designed to attract guests who value sustainable living and crew members passionate about homesteading, craftsmanship, and genuine hospitality.

## 🏡 About SILK Homes

SILK Homes operates a collection of character-rich historic homes across three locations:
- **Ravenswood, WV**: Four 1890s cottages forming a community cluster
- **Parkersburg, WV**: Mid-century 1950s homes with urban amenities
- **Marietta, OH**: Historic properties in Ohio's first permanent settlement

Each property features victory gardens, thrifted furnishings with soul, and is maintained by our dedicated hospitality crew who live the principles of sustainable, community-centered living.

## 🌐 Website Overview

### Multi-Page Architecture
- **Home**: Community overview with quick feature highlights
- **Story**: Narrative about commune origins and community philosophy  
- **Principles**: Five core values with detailed explanations
- **Crew**: Job opportunities with application system
- **Locations**: Dedicated subpages for each geographic area
- **Journal**: Community updates showcasing real projects
- **Community**: Affiliations with intentional community networks
- **Contact**: Comprehensive contact form and information

### Design Philosophy
The website embodies our community values through:
- **Earthy Visual Identity**: Browns, tans, soft greens reflecting our connection to the land
- **Authentic Content**: Real stories, actual projects, genuine community updates
- **Accessibility**: Mobile-first responsive design, semantic HTML, proper alt tags
- **Community Integration**: Full SILK Network footer linking all affiliated ventures

## 🛠 Technical Implementation

### Technology Stack
- **Frontend**: HTML5, CSS3, Bootstrap 5
- **Fonts**: Google Fonts (Merriweather serif, Open Sans sans-serif)
- **Forms**: Formspree for contact form processing
- **Hosting**: GitHub Pages (static site)
- **Version Control**: Git with automated deployment

### File Structure
```
/
├── index.html                 # Home page
├── pages/
│   ├── story.html            # Community origins and philosophy
│   ├── principles.html       # Five core values
│   ├── crew.html            # Job opportunities
│   ├── journal.html         # Community updates
│   ├── community.html       # Affiliations and networks
│   └── contact.html         # Contact form and information
├── locations/
│   ├── ravenswood.html      # Historic cottage cluster
│   ├── parkersburg.html    # Mid-century properties
│   └── marietta.html       # Ohio River heritage
├── css/
│   └── style.css           # Custom styles and components
├── js/
│   └── main.js            # Interactive functionality
├── images/
│   └── hero-bg.svg        # Custom hero background
├── CLAUDE.md              # Development documentation
└── README.md              # This file
```

### Performance Features
- **Lightweight**: Minimal JavaScript, optimized CSS
- **Fast Loading**: SVG graphics, efficient layouts
- **Mobile Optimized**: Bootstrap responsive grid
- **SEO Ready**: Semantic markup, meta descriptions, proper heading structure

## 🎯 Target Audience

### Primary Audiences
1. **Travel Medical Professionals**: Seeking quiet, character-filled housing during assignments
2. **Intentional Community Seekers**: Individuals passionate about sustainable, community-centered living
3. **Homesteading Enthusiasts**: People interested in victory gardens, historic preservation, craftsmanship
4. **Hospitality Crew**: Those seeking meaningful work aligned with values of sustainability and community

### Persona Characteristics
Our ideal community members:
- Value **sustainability** over convenience
- Seek **community** over isolation  
- Appreciate **craftsmanship** over disposability
- Embrace **responsibility** for shared spaces and resources
- Find joy in **simple pleasures** like garden-fresh meals and restored antiques

## 🚀 Development Roadmap

### Phase 1: Foundation (COMPLETED ✅)
- [x] Multi-page website architecture
- [x] Responsive design implementation
- [x] Content management system for job postings
- [x] Contact form integration
- [x] SILK Network integration
- [x] Location subpages
- [x] Community journal system

### Phase 2: Refinement (NEXT)
- [ ] **SEO Optimization**: Target intentional community keywords
- [ ] **Performance Enhancement**: Core Web Vitals optimization
- [ ] **Content Strategy**: Regular journal updates, testimonials
- [ ] **User Experience**: Form optimization, navigation enhancement
- [ ] **Community Screening**: Multi-step application process
- [ ] **Error Handling**: Custom 404 page, graceful form validation
- [ ] **Analytics**: User behavior tracking and optimization

## 📝 Content Management

### Adding Job Opportunities
1. Navigate to `pages/crew.html`
2. Copy an existing `<article class="job-ad">` block
3. Paste below the last job listing
4. Edit the content within the new block
5. Commit and push changes

### Adding Journal Entries
1. Navigate to `pages/journal.html`
2. Copy an existing `<article class="journal-entry">` block
3. Paste at the top of the journal entries section
4. Update date, title, content, and image placeholder
5. Commit and push changes

### CSS Customization
The stylesheet (`css/style.css`) is organized into clearly commented sections:
- Typography and color variables
- Navigation and layout components
- Form styling and interactions
- Multi-page specific elements
- Responsive design breakpoints

## 🤝 SILK Network Integration

SILK Homes is part of the larger SILK Network of affiliated ventures:
- **SILK Corp**: Corporate foundation and investment
- **SILK Yoga**: Mindful movement and wellness
- **SILK Arts**: Creative expression and culture
- **SILK Cafe**: Community gathering and nourishment
- **SILK Homes**: Historic hospitality and community living
- **SILK Women**: Empowerment and sisterhood
- **SILK Tech**: Innovation and development (Coming Soon)
- **SILK Y.A.C.H.T.**: Maritime adventures and lifestyle

The website footer provides seamless navigation between all SILK ventures, reinforcing the interconnected nature of our community network.

## 🔧 Local Development

### Setup
```bash
git clone https://github.com/WorldEnterpriseGroup/silkhomes.git
cd silkhomes
```

### Viewing Locally
Since this is a static site, you can:
1. Open `index.html` directly in a browser
2. Use a local server for full functionality:
   ```bash
   python -m http.server 8000
   # or
   npx serve .
   ```

### Making Changes
1. Edit HTML, CSS, or JavaScript files
2. Test changes locally
3. Commit changes with descriptive messages
4. Push to GitHub (automatic deployment via GitHub Pages)

## 📊 Success Metrics

### Quality Over Quantity Focus
- **Crew Applications**: Prioritize value alignment over volume
- **Guest Satisfaction**: Long-term stays and repeat bookings
- **Community Growth**: Organic referrals from satisfied members
- **Local Integration**: Positive community relationships

### Measurable Goals
- **SEO Performance**: First page ranking for intentional community keywords
- **Form Completion**: >80% completion rate for contact forms
- **Mobile Experience**: Perfect mobile usability scores
- **Site Performance**: <3 second load times across all pages

## 🌱 Philosophy & Vision

This website serves as more than a marketing tool—it's the digital front door to our intentional living community. Every design decision, every word choice, and every user interaction is crafted to attract individuals who share our values of:

- **Authentic Community**: Building genuine relationships based on mutual support
- **Sustainable Living**: Practicing environmental stewardship and resourcefulness
- **Historic Preservation**: Honoring the past while building for the future
- **Meaningful Work**: Finding purpose in hospitality, craftsmanship, and service
- **Simple Pleasures**: Appreciating garden-fresh meals, handmade items, and peaceful spaces

## 📞 Contact & Support

- **General Inquiries**: info@silkhomes.org
- **Crew Opportunities**: crew@silkhomes.org  
- **Guest Services**: stay@silkhomes.org
- **Website Issues**: Use the contact form or open a GitHub issue

## 📄 License

MIT License - see LICENSE file for details.

---

*Built with 💚 by the SILK Homes community*