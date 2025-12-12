/**
 * Pre-cached Card GIF URLs
 * These are hardcoded GIF URLs fetched from Giphy to avoid rate limits.
 * When Giphy API is unavailable or rate-limited, these are used as fallbacks.
 * 
 * To add more GIFs, fetch them when rate limit resets and add them here.
 */

export interface CachedGifEntry {
    url: string;
    timestamp: number;
}

export const CARD_GIF_STATIC_CACHE: Record<string, CachedGifEntry> = {
    // === STARTER CARDS ===
    "cto_hotfix": {
        "url": "https://media1.giphy.com/media/srWhvPXx4jwJpKMAkO/200w.gif?cid=9f7e1c688k6h5wr84y5c2d3zo70gz7fudp2i3lkmtosi8jwg&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530054
    },
    "cto_brute_force": {
        "url": "https://media4.giphy.com/media/lFZKK1pINTGA8/200w.gif?cid=9f7e1c68exl1s2zs4s2htgnc62t0gzcwttj3m10taw79hnrh&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530050
    },
    "cto_quick_fix": {
        "url": "https://media4.giphy.com/media/9IpDRg7KcDXRX2Jzg3/200w.gif?cid=9f7e1c68tnjcbh7zuk36c8e6mqbc9x6awzwp6eh02h0wxnu5&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530049
    },
    "cto_stay_focused": {
        "url": "https://media0.giphy.com/media/UxsuAgU4UTq1OVRvaN/200w.gif?cid=9f7e1c68ckw0ak6hmohwsv6ewd4ngr1dgcjz7176f6zc2sxe&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530050
    },
    "cto_commit": {
        "url": "https://media1.giphy.com/media/3og0IAQG2BtR13joe4/200w.gif?cid=9f7e1c6888skt9dsqlgwuhrcabv8ipe90i6dspgvko2oy1py&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530055
    },

    // === COMMON ATTACKS ===
    "cto_batch_deploy": {
        "url": "https://media4.giphy.com/media/3ov9k5tHjRwFE3NpIc/200w.gif?cid=9f7e1c68ldwb1g2dwo3fwm4w5f1bjxgu8uap5ultiym5j2if&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530019
    },
    "cto_sprint_planning": {
        "url": "https://media1.giphy.com/media/azIQoZ5JzyfweGoC3j/200w.gif?cid=9f7e1c68vh36b2obqmrkxtiu38tkvme4ez090b2es7dd49jb&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530100
    },
    "cto_ship_it": {
        "url": "https://media3.giphy.com/media/Wlynow8F4QZ7ceQbnk/200w.gif?cid=9f7e1c68xw9c5bpcayjaem0ufszkwo21igx4piapfxc0ghk7&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530106
    },
    "cto_leverage": {
        "url": "https://media2.giphy.com/media/D75dgS1ol1RPUgcuCH/200w.gif?cid=9f7e1c68bzo7yoyflq62c903zv2znrfnbq7abhlz6zpe0lio&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530106
    },
    "cto_risk_mitigation": {
        "url": "https://media2.giphy.com/media/6Xxz19bwb891P9LlqJ/200w.gif?cid=9f7e1c68ybeyajsm5zc1m3s8c7lbsj0wx2dpfv7ty8oghx8j&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530100
    },
    "cto_shotgun_debug": {
        "url": "https://media0.giphy.com/media/nQ0bg6dYbjB2o/200w.gif?cid=9f7e1c688w7ox3rh4ntiyanldw7pizasd2rvjni4lw084hd9&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530285
    },
    "cto_cherry_pick": {
        "url": "https://media0.giphy.com/media/VrTtTArIazPiB6kbFm/200w.gif?cid=9f7e1c68hzyyb3awexdwgjcc9tlbeii4q30ct705houmoeqk&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530353
    },
    "cto_compounding_commits": {
        "url": "https://media1.giphy.com/media/13moAYtfjADJe0/200w.gif?cid=9f7e1c68iax7jatpmmzxcuwpdmh3osg1mlwvfbem1bygfic2&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530351
    },
    "cto_yolo_deploy": {
        "url": "https://media4.giphy.com/media/jcFRnDD07moHS/200w.gif?cid=9f7e1c68zqt5196p4jainbik7ff9ta2v8p227tqa1dchba44&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530352
    },
    "cto_dual_track": {
        "url": "https://media2.giphy.com/media/J1ilUrobyCRosUgxQf/200w.gif?cid=9f7e1c6856omw6lijfsea3c23xivyivjn90s6h7fz0tm9ju6&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530369
    },
    "cto_pair_programming": {
        "url": "https://media0.giphy.com/media/0Av9l0VIc01y1isrDw/200w.gif?cid=9f7e1c68gfn47e6nooa67ier57o4slwmn4oekflh7k98xaun&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530454
    },
    "cto_caffeine_boost": {
        "url": "https://media2.giphy.com/media/4pGQLBubthJdwahFUJ/200w.gif?cid=9f7e1c68s0gi1f1cyhm8hk2j3fh54gm60cqp4zyu0jinv1le&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530452
    },
    "cto_ship_and_pray": {
        "url": "https://media1.giphy.com/media/JULfVYQH3XkCxMV0QP/200w.gif?cid=9f7e1c68gmkl0c1uaeri6e4bbhi8y89xktpr107m19z63vab&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530454
    },
    "cto_all_hands": {
        "url": "https://media0.giphy.com/media/kAFuuguJvYfvr01iqU/200w.gif?cid=9f7e1c684m4vydqhshkdiqr1dmu79gwg45vj8nx4ijn1a42c&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530451
    },
    "cto_tech_shortcut": {
        "url": "https://media4.giphy.com/media/JQADfRyItCLSRguHrE/200w.gif?cid=9f7e1c687mpnr4dkhvr3w9zrcczz936y1bqu2igclcpxrw73&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530452
    },
    "cto_pivot_ready": {
        "url": "https://media2.giphy.com/media/3o6fIYdmPHy7NDPyNy/200w.gif?cid=9f7e1c68sse3jxywq65g019da1k9vvhpfv2n99zfrqjd6mee&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530691
    },
    "cto_standup_notes": {
        "url": "https://media2.giphy.com/media/4rMp6ZvRLEg1GdcRnp/200w.gif?cid=9f7e1c68biqhvp2rrv17zxqxzinmz184gtm6lkgcbcvj8d2w&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530702
    },

    // === COMMON SKILLS ===
    "cto_tooling": {
        "url": "https://media0.giphy.com/media/54tjFdScFgtSzKb5Fm/200w.gif?cid=9f7e1c68dygpwnyu3fxprzf97deue5dlpzpdvemrpjkod6ho&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530694
    },
    "cto_refactor": {
        "url": "https://media0.giphy.com/media/4RXnzoIFLSL3S3JiAY/200w.gif?cid=9f7e1c683dlvshovehwwiho1c46cmtrej4habg13s09qh3vu&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530703
    },

    // === UNCOMMON ATTACKS ===
    "cto_root_cause": {
        "url": "https://media0.giphy.com/media/3oriO8vwmRIZO6kcNO/200w.gif?cid=9f7e1c681s0tlmzuuyfq84oyreoxi7un6pn510196y8sw9uz&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530703
    },
    "cto_hackathon": {
        "url": "https://media2.giphy.com/media/z10p2VLMxPvoouKm3d/200w.gif?cid=9f7e1c686lcpt4niux3f13z9gmh5zjt8cmujv3fqnyap80fk&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530877
    },
    "cto_viral_loop": {
        "url": "https://media2.giphy.com/media/5ClWABy95rD4YkZMFA/200w.gif?cid=9f7e1c68sfmjogh9x4d656w0f6ig6hcfznmnhsrelomlke48&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530871
    },
    "cto_market_window": {
        "url": "https://media4.giphy.com/media/eo9bBRGn1wKlHxB2uK/200w.gif?cid=9f7e1c68zxqkvs7cqq3ttabwv0eag9cqoyuk4fvntegbvw7m&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530877
    },
    "cto_blitzscaling": {
        "url": "https://media0.giphy.com/media/z8iezkkTQrX8Cp7wdo/200w.gif?cid=9f7e1c680fuwvw1o0ylzv0l99f3pb3x7jcmgefz6m5kwpjql&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530877
    },
    "cto_equity_dilution": {
        "url": "https://media2.giphy.com/media/pmGK469jWeXATZu9B1/200w.gif?cid=9f7e1c680ry70eo01okbbuj7hfpk6jydpofchj4366sskosh&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530879
    },
    "cto_clean_slate": {
        "url": "https://media1.giphy.com/media/l0Ex1E9dMTrWNREB2/200w.gif?cid=9f7e1c68lzo439pu63gybdrfmr97xu11fezy2hlyvjbrrma2&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511530985
    },
    "cto_flow_state": {
        "url": "https://media3.giphy.com/media/3o7aCZo69NeDeyGg3S/200w.gif?cid=9f7e1c685g487yuyazsibt7he3x79l1xdcbpyyqnveq18xw8&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531057
    },
    "cto_core_product": {
        "url": "https://media3.giphy.com/media/lCrLUcc2tGXtqbJ0fy/200w.gif?cid=9f7e1c681micsaqafb33w5aenjs4v5v0ggvymthr79riu2t9&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531059
    },
    "cto_bootstrapped": {
        "url": "https://media1.giphy.com/media/zIOdLMZDcBDc2gk6vV/200w.gif?cid=9f7e1c68myheog0ii8crhhph9w0vrc5y7p138gomjhg56qev&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531057
    },
    "cto_viral_growth": {
        "url": "https://media1.giphy.com/media/B0wch5W8sY8UTVZKnQ/200w.gif?cid=9f7e1c68iouq03nceu7if2wdf5ydvj8wce4rqmcnx1tc9kmd&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531059
    },

    // === UNCOMMON SKILLS ===
    "cto_bridge_round": {
        "url": "https://media3.giphy.com/media/CxEFuOTJisRWUZThMv/200w.gif?cid=9f7e1c688up7jl2j0wlgom7qefviqhe2eqi0vocqpiiqpcy1&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531161
    },
    "cto_firewall": {
        "url": "https://media4.giphy.com/media/6phmJICK7U0qr0Iq4w/200w.gif?cid=9f7e1c688dilg9wk8ewhj61ph9slpvf4nvjhzrlkygxwg5lw&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531164
    },
    "cto_talent_poach": {
        "url": "https://media4.giphy.com/media/lz4xVu4yTNHZXMXinh/200w.gif?cid=9f7e1c68dms4ebs7qqhva7ui27jlgdr63y055sktm9feae6l&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531166
    },
    "cto_market_disruption": {
        "url": "https://media0.giphy.com/media/vwqMX9Wvru80/200w.gif?cid=9f7e1c68gjo8o1mcju3ork9zs7v3d07k5sr7v9yf9n2c63m7&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531166
    },
    "cto_salary_cut": {
        "url": "https://media3.giphy.com/media/huana0WQzdDDG/200w.gif?cid=9f7e1c68qeewtiznvvntlhhimtm4rmco13aqacw4j1uw0sgy&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531166
    },
    "cto_paper_valuation": {
        "url": "https://media1.giphy.com/media/9MIn69rvV0SJgulSt3/200w.gif?cid=9f7e1c687jx7n1g0sq6bmr0yarsn34pvcydnye4j9k13wlkb&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531484
    },
    "cto_technical_bankruptcy": {
        "url": "https://media3.giphy.com/media/qIWq4nGpXEdGIfqXaI/200w.gif?cid=9f7e1c685v60xojuw3mfb3e3gj4a2d8srb1p6dvyt8uen5y2&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531484
    },
    "cto_double_down": {
        "url": "https://media1.giphy.com/media/AhcMxgEv9xfBC/200w.gif?cid=9f7e1c68j75t2p45osdxsiqglczokpmzidrbe8bayb86fzwy&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531482
    },
    "cto_failsafe": {
        "url": "https://media0.giphy.com/media/4T3R25CZiVyFGWos41/200w.gif?cid=9f7e1c68vt6r1z9uy2jwfxj0fsnvjsgw40vc5imizl5g0cmd&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531475
    },
    "cto_restructuring": {
        "url": "https://media3.giphy.com/media/IhFqKfG0vaUak/200w.gif?cid=9f7e1c685q2uv1jfmway5tndsfmhxpx5pusuc2coy4hobf7w&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531484
    },
    "cto_founder_mode": {
        "url": "https://media3.giphy.com/media/W3dwcIGum6xyS9xRyY/200w.gif?cid=9f7e1c68c0buitbxd86wp08r2txmfk3d7e5yxiztehkl7ksj&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531519
    },
    "cto_push_through": {
        "url": "https://media4.giphy.com/media/4ugmGpCqLiZWggjRwk/200w.gif?cid=9f7e1c688sv67rf2t78yi0ag3tw5qqqx363zjtnmhq3jynjx&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531520
    },
    "cto_ab_test": {
        "url": "https://media4.giphy.com/media/IL0wttCRBg8hwXt8XS/200w.gif?cid=9f7e1c68o3d5jf2bvsc5grovl5k64q2egc770359ppp0ibtm&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531520
    },
    "cto_market_fud": {
        "url": "https://media2.giphy.com/media/xUnBuQKWAcnb4lwh14/200w.gif?cid=9f7e1c686wjfqaalpch82epaloy9nwttz9kb8td1jdtl9o4j&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531524
    },
    "cto_wild_pitch": {
        "url": "https://media3.giphy.com/media/b9oHaxIw5WsQJ0658F/200w.gif?cid=9f7e1c68u42c816qq6xsl55agznld8zsb570749p4n5ssft6&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531524
    },

    // === UNCOMMON POWERS ===
    "cto_lean_ops": {
        "url": "https://media1.giphy.com/media/SIEXzdv1nrqtvsA8wI/200w.gif?cid=9f7e1c68v387cofqlmflfcusdvgmurs3yxcvw7ndlw54v6p4&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531781
    },
    "cto_code_review": {
        "url": "https://media1.giphy.com/media/yEDBFA7QiMVrbMN7o7/200w.gif?cid=9f7e1c68wdmb4ud7nnh46u5vqdtdy731ld152p41fs9xyupt&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531781
    },
    "cto_troubleshooting": {
        "url": "https://media1.giphy.com/media/B6bc6sP6Ro0Lv2ApSB/200w.gif?cid=9f7e1c685iy511in0ddomjanl79k733bl1bbqm2opxd910pb&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531778
    },
    "cto_resource_allocation": {
        "url": "https://media4.giphy.com/media/8SFtHxfATAb3n1ozVZ/200w.gif?cid=9f7e1c68v95hh246hqhxzq5clgm4oo2ap7b973doh6b7nx6y&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531780
    },
    "cto_caching": {
        "url": "https://media0.giphy.com/media/1m251nrt2jjqjWiHPQ/200w.gif?cid=9f7e1c688bnslw3uclrqimdrkmt6q8dww70v4lcp2jpfyh6r&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531780
    },
    "cto_dark_pattern": {
        "url": "https://media4.giphy.com/media/l2Sq57Tqj6p1SoRe8/200w.gif?cid=9f7e1c68vyl2xfrb3bxowzorhzg1utdcn66xlph8gyb750dl&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531799
    },
    "cto_antifragile": {
        "url": "https://media3.giphy.com/media/vUuqbHqB2sC1x6otmz/200w.gif?cid=9f7e1c68z620tryiccxdh1g6ezo2hy248u6qf75d77btzbew&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531811
    },
    "cto_acquihire": {
        "url": "https://media2.giphy.com/media/2rd3lJM0DPdwcLcSDk/200w.gif?cid=9f7e1c685scjs6mf52n3fzhrf1xckmjr8aov1a18nqx6zuic&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531811
    },
    "cto_bug_bounty": {
        "url": "https://media1.giphy.com/media/NaXGE7m7I7mcOn2M3c/200w.gif?cid=9f7e1c689pbuonmlr1c8flp1fozqbdhptaqnuvsovehdovsd&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531811
    },
    "cto_startup_grind": {
        "url": "https://media1.giphy.com/media/fqxjAeHzyh2fwOOrDX/200w.gif?cid=9f7e1c68kdo3s4e7ypmktwwgl5x4cvi4rcro93b8bpk5a07s&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511531811
    },

    // === RARE ATTACKS ===
    "cto_hostile_takeover": {
        "url": "https://media3.giphy.com/media/NtLQzStWclK4oN3UhP/200w.gif?cid=9f7e1c68ozqyyc44v6dv2urrzlhgj26o1f1551nf5yvfmvff&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511533074
    },
    "cto_crushing_it": {
        "url": "https://media1.giphy.com/media/XHGxMNkNgXpxRft87I/200w.gif?cid=9f7e1c68fx8sa4pce9okst5721hhp7qurasch3bf8x2ydo2x&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511533074
    },
    "cto_all_in_pivot": {
        "url": "https://media4.giphy.com/media/BMDz4JDNHtNHYy2gI8/200w.gif?cid=9f7e1c68se9nss4h04jcsixhcsqq02vdo8kqth6kzs0n9z7w&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511533074
    },
    "cto_10x_engineer": {
        "url": "https://media1.giphy.com/media/TilmLMmWrRYYHjLfub/200w.gif?cid=9f7e1c68h3mhc2b40engmkzvv4979poq22sva610qllec5pf&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511533075
    },
    "cto_burn_the_boats": {
        "url": "https://media0.giphy.com/media/6klu27Zy4LCSdWyfJq/200w.gif?cid=9f7e1c68t66kqtyw5p18bhylylquyqr65gjztrl05v59brak&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511533074
    },

    // === RARE SKILLS ===
    "cto_blood_equity": {
        "url": "https://media4.giphy.com/media/C0bLCTw7M2f0Cjt1QR/200w.gif?cid=9f7e1c6846dh25owa79oc9ndrsiqfy53xybq6sb1hbye7qdu&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511534066
    },
    "cto_copy_paste": {
        "url": "https://media1.giphy.com/media/65nOslq5IjxjJ8GYyU/200w.gif?cid=9f7e1c68zsyuy54xgexz9a9323u7jlv1wo10xp4pis53ycjg&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511534067
    },
    "cto_network_effects": {
        "url": "https://media3.giphy.com/media/xT4uQF7h39mlsF5czK/200w.gif?cid=9f7e1c68qnm4pkkymichunenszfwuumad1sgkkdoxl0rwit2&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511534067
    },
    "cto_zombie_feature": {
        "url": "https://media1.giphy.com/media/DVi83Pmb4qGy0SBvxQ/200w.gif?cid=9f7e1c68a2hyar7drawsafkmxfhyev4uts5lp7vmak79uu2l&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511534067
    },
    "cto_runway_extension": {
        "url": "https://media1.giphy.com/media/2WdIztX9iTFKQykukq/200w.gif?cid=9f7e1c68tmjv2cl3ykr82h38e8rr7ivi9fb265bvzu1zdh0x&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511534063
    },

    // === RARE POWERS ===
    "cto_tech_debt": {
        "url": "https://media1.giphy.com/media/Wt6kNaMjofj1jHkF7t/200w.gif?cid=9f7e1c68z6d3e1vjnmn9vupb2rvfmzwfbrq1342bq07e4pel&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511535038
    },
    "cto_crunch_culture": {
        "url": "https://media1.giphy.com/media/8mUmIW317lyOXTfHAe/200w.gif?cid=9f7e1c68dpxbg40e8xjxqjdrpj3mkkbnry17huwtnr4jxfta&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511535048
    },
    "cto_flywheel": {
        "url": "https://media1.giphy.com/media/l3diPg5IyuDjUzmww/200w.gif?cid=9f7e1c6856banxttla8fnfhww7ydl6u078floj7v4ipkr0s0&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511535051
    },
    "cto_hypergrowth": {
        "url": "https://media1.giphy.com/media/3o6ZtkH8bL3rZFvz56/200w.gif?cid=9f7e1c68fjc8tywaxpgj8evco5c4palz0ovvtwzgvv7g5jlv&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511535050
    },
    "cto_war_chest": {
        "url": "https://media0.giphy.com/media/EkqBdWDclxlL4Hf27U/200w.gif?cid=9f7e1c68y3395mbshb5pg6iog857ocyl9wa5hqs6vv443vdj&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511535048
    },

    // === STATUS CARDS ===
    "status_legacy_code": {
        "url": "https://media3.giphy.com/media/f3S0GZAviiuXI2dvV0/200w.gif?cid=9f7e1c68gu5s2ihayuz894bdwv4ocwqx6ga8zfmepjitno6w&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511536060
    },
    "status_bug": {
        "url": "https://media0.giphy.com/media/hcRkZsH1YdlR5WEg7a/200w.gif?cid=9f7e1c684nhj1ogmzkbfsxrcpzvmmwbtasbygdirrs666vqe&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511536060
    },
    "status_context_switch": {
        "url": "https://media2.giphy.com/media/atQF1zaSGq8s8/200w.gif?cid=9f7e1c68luii2eah2kyahqnx8yx1bqsu03lt4atl26ovww4t&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511536060
    },
    "status_burnout": {
        "url": "https://media4.giphy.com/media/37ZOSOoKUpT4uDgFpi/200w.gif?cid=9f7e1c68mizuqvo5pwr2hj4j42icdmne3sg18i4sigyneg7l&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511536047
    },
    "status_scope_creep": {
        "url": "https://media2.giphy.com/media/3o85xvkkdRTgvxfwSQ/200w.gif?cid=9f7e1c68rr6gts8zt11bupaf46zrlye1lfkf9ij4zawqgdtp&ep=v1_gifs_search&rid=200w.gif&ct=g",
        "timestamp": 1765511536060
    }
};

/**
 * Get a static GIF URL for a card (fallback when API is unavailable)
 */
export function getStaticCardGif(cardId: string): string | null {
    const entry = CARD_GIF_STATIC_CACHE[cardId];
    return entry?.url || null;
}

/**
 * Check if a card has a static GIF available
 */
export function hasStaticCardGif(cardId: string): boolean {
    return cardId in CARD_GIF_STATIC_CACHE;
}

/**
 * Get all cached card IDs
 */
export function getStaticCardIds(): string[] {
    return Object.keys(CARD_GIF_STATIC_CACHE);
}
