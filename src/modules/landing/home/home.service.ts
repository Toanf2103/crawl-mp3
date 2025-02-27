import { BaseService } from '@/modules/base/service';
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class HomeService extends BaseService {
  constructor() {
    super();
  }
  getFooter() {
    const data = [
      {
        title: 'Browse by subject',
        items: [
          { label: 'Computer Science', slug: '/computer' },
          { label: 'Psychology', slug: '/psychology' },
          { label: 'Cybersecurity', slug: '/cybersecurity' },
          { label: 'Health', slug: '/health' },
        ],
      },
      {
        title: 'Browse by provider',
        items: [
          { label: 'Coursera', slug: '/coursera' },
          { label: 'edX', slug: '/edX' },
          { label: 'Udacity', slug: '/udacity' },
          { label: 'Udemy', slug: '/udemy' },
        ],
      },
      {
        title: 'Browse by university',
        items: [
          { label: 'Harvard', slug: '/Harvard' },
          { label: 'Stanford', slug: '/Stanford' },
          { label: 'Georgia Tech', slug: '/Georgia Tech' },
          { label: 'University of Michigan', slug: '/University of Michigan' },
        ],
      },
      {
        title: 'Browse by institution',
        items: [
          { label: 'Google', slug: '/Google' },
          { label: 'Microsoft', slug: '/Microsoft' },
          { label: 'IBM', slug: '/IBM' },
          { label: 'Amazon', slug: '/Amazon' },
        ],
      },
      {
        title: 'Rankings',
        items: [
          { label: 'Best Online Courses of All Time', slug: '/all-time' },
          { label: 'Best Online Courses of the Year', slug: '/the-year' },
          { label: 'Most Popular Courses of All Time', slug: '/course-all-time' },
          { label: 'Most Popular Courses of the Year', slug: '/popular' },
        ],
      },
      {
        title: 'The report by Class Central',
        items: [
          { label: 'The "New Normal" that Wasn', slug: '/that-wasn' },
          { label: 'DDoS Attack on Class Central', slug: '/ddos' },
          { label: '500+ Online Degrees in India', slug: '/india' },
          { label: "Harvard's CS50 Free Certificate Guide", slug: '/guide' },
        ],
      },
      {
        title: 'Free Certificates & Courses',
        items: [
          { label: '600 Free Google Certificates', slug: '/600-free' },
          { label: '9000 Free Courses from Tech Giants', slug: '/9000-free' },
          { label: '1700 Free Coursera Courses', slug: '/1700-free' },
          { label: 'Ivy League Online Courses', slug: '/online-course' },
        ],
      },
    ];
    return data;
  }
  getNavHeader() {
    const data = [
      {
        label: 'News',
        slug: '/category/news',
      },
      {
        label: 'analysis',
        slug: '/category/analysis',
      },
      {
        label: 'best courses',
        slug: '/category/best-courses',
      },
      {
        label: 'ranking',
        subNav: [
          {
            label: 'Best free online Courses',
            slug: '/collection/top-free-online-courses',
          },
          {
            label: 'Most popular',
            slug: '/most-popular-online-courses',
          },
        ],
      },
      {
        label: 'all',
        slug: '/article/archives',
      },
    ];
    return data;
  }
}
