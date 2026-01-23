'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, MapPin, Users, Trophy, Heart } from 'lucide-react'
import { SponsorshipPackagesModal } from '@/components/sponsorship-packages-modal'
import { tournamentConfig, getTournamentFullName } from '@/lib/config/tournament.config'

// Config shortcuts
const { tournament, dates, venue, events, branding, sponsorship } = tournamentConfig
const fullName = getTournamentFullName()

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <section className="relative py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6">
            <Image
              src="/frogman-logo.png"
              alt={`${tournament.name} Logo`}
              width={200}
              height={200}
              className="mx-auto"
              priority
            />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-green-800 mb-4">
            {tournament.name}
          </h1>
          <p className="text-xl md:text-2xl text-green-700 mb-2">
            {tournament.tagline}
          </p>
          <p className="text-lg text-gray-600 mb-8">
            {tournament.mission}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-gray-700 mb-8">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <span className="font-medium">{dates.display}</span>
            </div>
            <span className="hidden sm:block text-gray-300">|</span>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              <span className="font-medium">{venue.name}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/register">
                <Users className="w-5 h-5 mr-2" />
                Register Your Team
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8">
              <Link href="/sponsor">
                <Heart className="w-5 h-5 mr-2" />
                Become a Sponsor
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">
            Two Great Events
          </h2>
          <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
            Join us for a weekend of golf, camaraderie, and support for those who served.
            Choose one event or play them both!
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-2 hover:border-green-200 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium">{dates.friday}</span>
                </div>
                <CardTitle className="text-2xl">{events.friday.name}</CardTitle>
                <CardDescription>
                  {events.friday.format} · Sponsor entry only
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {events.friday.description}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-green-200 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium">{dates.satSun}</span>
                </div>
                <CardTitle className="text-2xl">{events.satSun.name}</CardTitle>
                <CardDescription>
                  {events.satSun.format} · ${events.satSun.basePrice} entry (${venue.memberDiscount} off per {venue.name} member)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {events.satSun.description}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 bg-green-50">
        <div className="max-w-3xl mx-auto text-center">
          <Trophy className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            More Than a Tournament
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            The {tournament.name} brings together golfers, veterans, and supporters
            to honor the service and sacrifice of those who served our country.
            All proceeds benefit the {branding.charityName}.
          </p>

          <div className="flex flex-col items-center gap-4 mb-6">
            <Image
              src="/best-defense-foundation.png"
              alt={`${branding.charityName} - ${branding.charityTagline}`}
              width={400}
              height={100}
              className="max-w-full h-auto"
            />
            <a
              href={branding.charityUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-700 underline text-sm"
            >
              Learn more about the {branding.charityName}
            </a>
          </div>

          <p className="text-gray-500">
            Play golf. Build friendships. Make a difference.
          </p>
        </div>
      </section>

      {/* Sponsorship CTA */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Sponsor the {tournament.name}
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Sponsorship packages start at ${sponsorship.startingPrice} and include benefits like team entries,
            banner placement, dinner tables, and more.
          </p>
          <SponsorshipPackagesModal />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-50 border-t">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/frogman-logo.png"
              alt={tournament.name}
              width={40}
              height={40}
            />
            <span className="text-gray-600 font-medium">{fullName}</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/sponsor" className="hover:text-green-600 transition-colors">
              Sponsors
            </Link>
            <Link href="/register" className="hover:text-green-600 transition-colors">
              Register
            </Link>
            <Link href="/admin" className="hover:text-green-600 transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
