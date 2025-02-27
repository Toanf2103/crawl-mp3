import { BaseService } from '@/modules/base/service';
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class ClassroomService extends BaseService {
  constructor() {
    super();
  }
  async getClassroomDetail(slug: string) {
    const data = {
      id: 1,
      title: 'YouTube SEO - Video Marketing',
      image: 'https://d3f1iyfxxz8i1e.cloudfront.net/courses/course_image/f172e0201376.jpg',
      playlist: [
        {
          title: 'Complete YouTube Ads Strategy to Grow Your Channel ($43K Spent)',
          thumbnail: 'blob:https://www.youtube.com/e7c4705b-1fd0-4ecf-abe1-ad764bead0a8',
          video:
            'https://www.youtube.com/embed/YShyWxW2iB4?autoplay=0&controls=0&disablekb=1&playsinline=1&cc_load_policy=1&cc_lang_pref=en&widget_referrer=https%3A%2F%2Fwww.classcentral.com%2Fclassroom%2Fyoutube-youtube-seo-video-marketing-48158&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1&customControls=true&noCookie=false&fs=1&enablejsapi=1&origin=https%3A%2F%2Fwww.classcentral.com&widgetid=20',
        },
        {
          title: 'How to Get More YouTube Subscribers',
          thumbnail: 'blob:https://www.youtube.com/69ced631-f388-48f7-b4fd-73e1a35a95b8',
          video:
            'https://www.youtube.com/embed/NR_V2nGSp98?autoplay=0&controls=0&disablekb=1&playsinline=1&cc_load_policy=1&cc_lang_pref=en&widget_referrer=https%3A%2F%2Fwww.classcentral.com%2Fclassroom%2Fyoutube-youtube-seo-video-marketing-48158%2F60e6ba2d85a0f&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1&customControls=true&noCookie=false&fs=1&enablejsapi=1&origin=https%3A%2F%2Fwww.classcentral.com&widgetid=19',
        },
        {
          title: 'Video SEO: How to Rank YouTube Videos on the First Page of Google (Fast)',
          thumbnail: 'blob:https://www.youtube.com/f49d06cd-955d-40aa-8f4c-c8de364c7847',
          video:
            'https://www.youtube.com/embed/BObU_VCwnvY?autoplay=0&controls=0&disablekb=1&playsinline=1&cc_load_policy=1&cc_lang_pref=en&widget_referrer=https%3A%2F%2Fwww.classcentral.com%2Fclassroom%2Fyoutube-youtube-seo-video-marketing-48158%2F60e6ba2d85a19&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1&customControls=true&noCookie=false&fs=1&enablejsapi=1&origin=https%3A%2F%2Fwww.classcentral.com&widgetid=24',
        },
      ],
    };
    return data;
  }
}
