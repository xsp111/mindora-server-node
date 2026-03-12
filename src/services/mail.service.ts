import type { User } from '@prisma/client';
import nodemailer from 'nodemailer';
import msg from '../const/msg.js';
import { authService } from './index.js';

function getHTMLTemplate({
	sendTo,
	token,
}: {
	sendTo: string;
	token: string;
}): string {
	return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
	<head>
		<link
			rel="preload"
			as="image"
			href="https://mindora.xsp111.cn/static/img/logo.svg"
		/>
		<meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
		<meta name="x-apple-disable-message-reformatting" />
		<!--$-->
	</head>
	<body style="background-color: rgb(255, 255, 255)">
		<table
			border="0"
			width="100%"
			cellpadding="0"
			cellspacing="0"
			role="presentation"
			align="center"
		>
			<tbody>
				<tr>
					<td
						style="
							background-color: rgb(255, 255, 255);
							color: rgb(36, 41, 46);
							font-family: -apple-system, BlinkMacSystemFont,
								'Segoe UI', Helvetica, Arial, sans-serif,
								'Apple Color Emoji', 'Segoe UI Emoji';
						"
					>
						<div
							style="
								display: none;
								overflow: hidden;
								line-height: 1px;
								opacity: 0;
								max-height: 0;
								max-width: 0;
							"
							data-skip-in-text="true"
						>
							您正在登录 Mindora
							<div>
								‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿
								‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿
								‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿
								‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿
								‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿
								‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿
								‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿
								‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿
								‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿
								‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿
								‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿
								‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿
							</div>
						</div>
						<table
							align="center"
							width="100%"
							border="0"
							cellpadding="0"
							cellspacing="0"
							role="presentation"
							style="
								max-width: 480px;
								margin-right: auto;
								margin-left: auto;
								margin-bottom: 0;
								margin-top: 0;
								padding-top: 20px;
								padding-bottom: 48px;
								padding-right: 0;
								padding-left: 0;
							"
						>
							<tbody>
								<tr style="width: 100%">
									<td>
										<img
											alt="Github"
											height="64"
											src="https://mindora.xsp111.cn/static/img/logo.svg"
											style="
												display: block;
												outline: none;
												border: none;
												text-decoration: none;
											"
											width="32"
										/>
										<p
											style="
												font-size: 20px;
												line-height: 1.25;
												margin-top: 16px;
												margin-bottom: 16px;
											"
										>
											<strong>@<!-- -->${sendTo}</strong
											>，登录到
											<strong style="color: #c84444"
												>Mindora</strong
											>
										</p>
										<table
											align="center"
											width="100%"
											border="0"
											cellpadding="0"
											cellspacing="0"
											role="presentation"
											style="
												padding: 24px;
												border-style: solid;
												border-width: 1px;
												border-color: rgb(
													222,
													222,
													222
												);
												border-radius: 5px;
												text-align: center;
											"
										>
											<tbody>
												<tr>
													<td>
														<p
															style="
																font-size: 14px;
																line-height: 24px;
																margin-bottom: 10px;
																margin-top: 0;
																text-align: left;
															"
														>
															您好
															<strong
																>${sendTo}</strong
															>!
														</p>
														<p
															style="
																font-size: 14px;
																line-height: 24px;
																margin-bottom: 10px;
																margin-top: 0;
																text-align: left;
															"
														>
															您正在通过邮箱登录
															<strong
																style="
																	color: #c84444;
																"
																>Mindora</strong
															>，请点击下方按钮验证登录。
														</p>
														<a
															href="https://mindora.xsp111.cn/static/login.html?verifyToken=${token}"
															style="
																line-height: 1.5;
																text-decoration: none;
																display: inline-block;
																max-width: 100%;
																mso-padding-alt: 0px;
																font-size: 14px;
																background-color: #c84444;
																color: rgb(
																	255,
																	255,
																	255
																);
																border-radius: 0.5rem;
																padding-bottom: 12px;
																padding-top: 12px;
																padding-right: 24px;
																padding-left: 24px;
															"
															target="_blank"
															><span
																><!--[if mso
																	]><i
																		style="
																			mso-font-width: 400%;
																			mso-text-raise: 18;
																		"
																		hidden
																		>&#8202;&#8202;&#8202;</i
																	><!
																[endif]--></span
															><span
																style="
																	max-width: 100%;
																	display: inline-block;
																	line-height: 120%;
																	mso-padding-alt: 0px;
																	mso-text-raise: 9px;
																"
																>验证登录</span
															><span
																><!--[if mso
																	]><i
																		style="
																			mso-font-width: 400%;
																		"
																		hidden
																		>&#8202;&#8202;&#8202;&#8203;</i
																	><!
																[endif]--></span
															></a
														>
													</td>
												</tr>
											</tbody>
										</table>
									</td>
								</tr>
							</tbody>
						</table>
					</td>
				</tr>
			</tbody>
		</table>
		<!--/$-->
	</body>
</html>
	`;
}

const mailer = nodemailer.createTransport({
	host: 'smtp.qq.com',
	port: 587,
	secure: false,
	auth: {
		user: process.env.EMAIL,
		pass: process.env.EMAIL_PASSWORD,
	},
});

type VerifySuccessCallback = (
	user: Pick<User, 'id' | 'name' | 'avatar'> & { accessToken: string },
) => Promise<void>;

type VerifyFailCallback = (error: string) => Promise<void>;

type verifyState = {
	sendTo: string;
	state: 'init' | 'waiting' | 'verified' | 'failed';
	refreshToken: string;
	user?: Pick<User, 'id' | 'name' | 'avatar'> & { accessToken: string };
	verifySuccessCallback: VerifySuccessCallback | undefined;
	verifyFailCallback: VerifyFailCallback | undefined;
};
//TODO map仅临时使用，后续应替换为其他存储
export const mail2Token = new Map<string, verifyState>();

async function sendVerifyMail({ sendTo }: { sendTo: string }) {
	const verifyToken = authService.getRefreshToken();
	const refreshToken = authService.getRefreshToken();
	await mailer.sendMail({
		from: `"Mindora" <xsp111_2025@qq.com>`,
		to: sendTo,
		subject: '登录验证',
		html: getHTMLTemplate({
			sendTo,
			token: verifyToken,
		}),
	});
	mail2Token.set(verifyToken, {
		sendTo,
		state: 'init',
		refreshToken,
		verifySuccessCallback: undefined,
		verifyFailCallback: undefined,
	});
	return { verifyToken, refreshToken };
}

async function wait4ClientVerify({
	verifyToken,
	verifySuccessCallback,
	verifyFailCallback,
}: {
	verifyToken: string | undefined;
	verifySuccessCallback: VerifySuccessCallback;
	verifyFailCallback: VerifyFailCallback;
}) {
	if (!verifyToken) {
		throw new Error(msg.VERIFY_EMAIL_TOKEN_INVALID);
	}
	const clientConn = mail2Token.get(verifyToken);
	if (!clientConn) {
		throw new Error(msg.VERIFY_EMAIL_FAILED);
	}
	if (clientConn.state === 'verified') {
		verifySuccessCallback(clientConn.user!);
		mail2Token.delete(verifyToken);
	} else if (clientConn.state === 'failed') {
		verifyFailCallback(msg.EMAIL_LOGIN_FAILED);
	} else {
		clientConn.state = 'waiting';
		clientConn.verifySuccessCallback = verifySuccessCallback;
		clientConn.verifyFailCallback = verifyFailCallback;
	}
}

export { sendVerifyMail, wait4ClientVerify };
