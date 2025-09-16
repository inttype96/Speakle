export default function Footer() {
    return (
        <div className="bg-background py-24 sm:py-32 mt-10">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <h2 className="text-center text-lg/8 font-semibold text-foreground">
                    Trusted by the world’s most innovative teams
                </h2>
                <div className="mx-auto mt-10 grid max-w-lg grid-cols-4 items-center gap-x-8 gap-y-10 sm:max-w-xl sm:grid-cols-6 sm:gap-x-10 lg:mx-0 lg:max-w-none lg:grid-cols-5">
                    <img
                        alt="React"
                        src="https://simpleicons.org/icons/react.svg"
                        width={158}
                        height={48}
                        className="col-span-2 max-h-12 w-full object-contain lg:col-span-1 dark:invert"
                    />
                    <img
                        alt="Spring Boot"
                        src="https://simpleicons.org/icons/springboot.svg"
                        width={158}
                        height={48}
                        className="col-span-2 max-h-12 w-full object-contain lg:col-span-1 dark:invert"
                    />
                    <img
                        alt="Nginx Proxy Manager"
                        src="https://simpleicons.org/icons/nginxproxymanager.svg"
                        width={158}
                        height={48}
                        className="col-span-2 max-h-12 w-full object-contain lg:col-span-1 dark:invert"
                    />
                    <img
                        alt="Statamic"
                        src="https://simpleicons.org/icons/docker.svg"
                        width={158}
                        height={48}
                        className="col-span-2 col-start-2 max-h-12 w-full object-contain sm:col-start-auto lg:col-span-1 dark:invert"
                    />
                    <img
                        alt="SavvyCal"
                        src="https://www.svgrepo.com/show/448299/aws.svg"
                        width={158}
                        height={48}
                        className="col-span-2 max-h-12 w-full object-contain sm:col-start-2 lg:col-span-1 dark:invert"
                    />
                </div>
            </div>
        </div>
    )
}
