import Link from 'next/link';
import Button from './components/ui/button';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md z-50 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Image src="/Groovo-red.svg" alt="Groovo" width={120} height={40} className="h-8 w-auto" />
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="outline" size="sm" width="auto">
                Login
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="green" size="sm" width="auto" className="!bg-[#bb2169] hover:!bg-[#a01d5c]">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <Image src="/Groovo-red.svg" alt="Groovo" width={300} height={100} className="h-24 w-auto" />
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-[#bb2169] via-[#f48323] to-[#bb2169] bg-clip-text text-transparent">
            The Friendly Music App
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            Build playlists with friends and share your favorite tunes. 
            Music is better together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/register">
              <Button variant="green" size="lg" width="auto" className="px-12 !bg-[#bb2169] hover:!bg-[#a01d5c]">
                Start Listening
              </Button>
            </Link>
            <Link href="#about">
              <Button variant="outline" size="lg" width="auto" className="px-12">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6 bg-neutral-900 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">About Groovo</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              We believe music brings people together. Groovo makes it easy to discover, 
              share, and enjoy music with the people you care about.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="text-4xl mb-4">🎵</div>
              <h3 className="text-2xl font-bold mb-3">Unlimited Music</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Access songs and create unlimited playlists. Your music library, your way.
              </p>
            </div>
            <div className="bg-background p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-2xl font-bold mb-3">Collaborative Playlists</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Build playlists together with friends in real-time. Everyone can add their favorites.
              </p>
            </div>
            <div className="bg-background p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold mb-3">Easy Sharing</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Share your playlists instantly. Discover what your friends are listening to.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why-us" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">Why Choose Groovo?</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              We're not just another music app. Here's what makes us different.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#bb2169] rounded-full flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Built for Collaboration</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Unlike traditional music apps, Groovo is designed from the ground up for sharing 
                    and collaborating with friends.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#f48323] rounded-full flex items-center justify-center text-white font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Real-Time Updates</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    See changes instantly as your friends add songs. No refresh needed, 
                    just smooth, real-time collaboration.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-[#bb2169] rounded-full flex items-center justify-center text-white font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Simple & Intuitive</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Clean design, easy navigation. Spend less time figuring out the app 
                    and more time enjoying music.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#bb2169] via-[#f48323] to-[#bb2169] rounded-2xl p-1">
              <div className="bg-background rounded-xl p-12 h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎧</div>
                  <p className="text-2xl font-bold mb-2">Join thousands of music lovers</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Creating and sharing playlists every day
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-neutral-900 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Everything you need for the ultimate music experience.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-background p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3">💝</div>
              <h3 className="text-lg font-bold mb-2">Share Emotions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Express your feelings through music and connect with friends.
              </p>
            </div>
            <div className="bg-background p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3">🔄</div>
              <h3 className="text-lg font-bold mb-2">Live Sync</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Changes sync instantly across all devices.
              </p>
            </div>
            <div className="bg-background p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3">🎨</div>
              <h3 className="text-lg font-bold mb-2">Custom Playlists</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Personalize with names, descriptions, and artwork.
              </p>
            </div>
            <div className="bg-background p-6 rounded-xl border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
              <div className="text-3xl mb-3">🌙</div>
              <h3 className="text-lg font-bold mb-2">Dark Mode</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Easy on the eyes, perfect for night listening.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Join Groovo today and experience music like never before. 
            It's free to get started.
          </p>
          <Link href="/auth/register">
            <Button variant="green" size="lg" width="auto" className="px-16 !bg-[#bb2169] hover:!bg-[#a01d5c]">
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h3 className="font-display font-bold text-lg mb-2">Groovo</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The friendly music app. Build playlists with friends.
              </p>
            </div>
            <div className="flex gap-4">
              <Link href="/auth/login">
                <Button variant="outline" size="sm" width="auto">
                  Login
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="green" size="sm" width="auto" className="!bg-[#bb2169] hover:!bg-[#a01d5c]">
                  Register
                </Button>
              </Link>
            </div>
          </div>
          <div className="dark:border-gray-800 mt-8 pt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>&copy; {new Date().getFullYear()} Groovo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
