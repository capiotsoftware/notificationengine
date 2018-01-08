import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NgbModal, NgbModalOptions, ModalDismissReasons, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { error } from 'util';
@Component({
	selector: 'app-Subscritions',
	templateUrl: './subscriptions.component.html',
	styleUrls: ['./subscriptions.component.css'],
	providers: []
})
export class SubscriptionsComponent implements OnInit {

	public subscriptions: any = [];
	public subscription = null;
	public delSubscription = null;
	public form: any;
	public subcriptionForm: any;
	public page = 1;
	public count = 10;
	public total: number = 0;
	public loader_table = false;
	public loader_data = false;
	public users: any = [];
	public groups: any = [];
	public eventTypeahead: any = [];
	public show: boolean = false;
	public subscritpionObject: any = {};
	public recipientsArray: any = [];
	public selectionName: string;
	public successMessage: string;
	private addEditModal: NgbModalRef;
	public sucessShow: boolean = false;
	public eventId: string;
	public eventArray: any = [];
	public usersArray: any = [];
	public userName: string;
	public userID: string;
	public showUser: boolean = false;
	public showGroup: boolean = false;
	public showGroupList: boolean = false;
	public showUserList: boolean = false;
	public groupName: string;
	public groupsArray: any = [];
	public errorMessage: string;
	public errorShow: boolean = false;
	@ViewChild('add') add;

	private URL = "http://localhost:10010/ne/subscribe";
	private URL_Event = "http://localhost:10010/ne/event";
	private URL_User = "http://localhost:10011/user";
	private URL_Group = "http://localhost:10011/group";

	constructor(
		private http: HttpClient,
		private fb: FormBuilder,
		private modalService: NgbModal) {
		this.form = fb.group({
			'name': [null, null],

		});
		this.subcriptionForm = {};
	}

	ngOnInit() {
		this.fetchAllUsers();
		this.getCount(null);
		this.get(0, null);

	}

	getCount(_filter) {
		let params = "";
		if (_filter) params += "?filter=" + JSON.stringify(_filter);
		this.http.get(this.URL + "/count" + params)
			.subscribe(_d => this.total = <number>_d);
	}

	reset() {
		this.form.reset();
		this.getCount(null);
		this.get(0, null);
	}

	get(_page, _filter) {
		// this.subscription = null;
		this.loader_table = true;
		this.loader_data = true;
		let filter = {};
		if (_filter && _filter.name) filter["name"] = "/" + _filter.name + "/";
		this.http.get(this.URL + '?filter=' + JSON.stringify(filter))
			.subscribe(_data => {
				this.subscriptions = _data;
				if (this.subscriptions.length) {
					this.subscriptions.forEach(_d => {
						this.subscription = this.subscriptions[0];
						_d["_event"] = { "name": null };
						this.getEventName(_d.eventID).subscribe(_e => _d["_event"] = _e);
						_d.recipients.forEach(_r => {
							if (_r.type == "user") _r["_name"] = this.getUser(_r.id);
							else _r["_name"] = this.getGroup(_r.id);
						});
					});
				}
				this.loader_table = false;
				this.loader_data = false;
			});
	}

	delete(_id) {
		this.http.delete(this.URL + "/" + this.delSubscription._id)
			.subscribe(_d => {
				this.getCount(null);
				this.get(0, null);
			})
	}

	addEditSubscription(_add, flag: boolean) {
		this.subcriptionForm.isNew = flag;
		if (flag == false) {
			let options: NgbModalOptions = { backdrop: "static" };
			this.subcriptionForm.name = this.subscription.name;
			this.subcriptionForm._eventName = this.subscription._event.name;
			this.subscriptions[0];
			for (var i = 0; i < this.subscriptions[0].length; i++) {
				if (this.subscriptions[i].name == this.subscription.name) {
					this.subscription.recipients = this.subscriptions[i].recipients
				}
			}
			this.subscription.recipients = this.subscription.recipients;
			this.sucessShow = false;
			this.errorShow=false;
			this.addEditModal=this.modalService.open(_add, options);
		} else {
			let options: NgbModalOptions = { backdrop: "static" };
			this.subcriptionForm._eventName = '';
			this.sucessShow = false;
			this.errorShow=false;
			this.addEditModal=this.modalService.open(_add, options);
			this.subcriptionForm.name = '';
		}
	}

	deleteSub(i, _delete, flag: boolean) {
		if (flag) this.delSubscription = i;
		else this.delSubscription = this.subscriptions[i];
		this.modalService.open(_delete).result.then((result) => {
			if (result) {
				this.http.delete(this.URL + "/" + this.delSubscription._id)
					.subscribe(_d => {
						this.getCount(null);
						this.get(0, null);
					})
			}
		}, (reason) => {
		});
	}

	getEventName(_id) {
		return this.http.get(this.URL_Event + '/' + _id + "?select=name")
	}
	changeUserType(e: any) {
		if (e.target.value == "user") {
			this.showUser = true;
			this.showGroup = false;

		} else {
			this.showUser = false;
			this.showGroup = true;

		}
	}

	searchEvents(_name) {
		let filter = {};
		if (_name) filter["name"] = "/" + _name + "/";
		return this.http.get(this.URL_Event + '?filter=' + JSON.stringify(filter));
	}

	fetchAllUsers() {
		this.http.get(this.URL_User).subscribe(_d => this.users = _d);
		this.http.get(this.URL_Group).subscribe(_d => this.groups = _d);

	}

	getUser(_id) {
		let user = null;
		this.users.forEach(_u => {
			if (_u._id == _id) user = _u.name;
		});
		return user;
	}
	getUserTypeahead(e: any) {
		this.showUserList = true;
		this.usersArray = this.users.filter(_u => _u.name.toLowerCase().indexOf(this.userName.toLowerCase()) != -1);
	}
	getUserNameTypeahead(index) {
		this.userName = this.usersArray[index].name;
		this.showUserList = false;

	}
	getgroupNameTypeahead() {
		this.showGroupList = true;
		this.groupsArray = this.groups;
		
	}
	getnameTypeahead(index) {
		this.groupName = this.groupsArray[index].name;
		this.showGroupList = false;
		
	}
	getGroup(_id) {
		let group = null;
		this.groups.forEach(_g => {
			if (_g._id == _id) group = _g.name;
		});

		return group;
	}
	addrecipients() {

		let name = "";
		if (this.selectionName == "user") {
			if (!this.subcriptionForm.isNew) {
				var recipientsObject = {};
				for (var i = 0; i < this.usersArray.length; i++) {
					if (this.usersArray[i].name == this.userName) {
						this.userID = this.usersArray[i]._id;
						name = this.usersArray[i].name;
					}
				}
				recipientsObject['id'] = this.userID;
				recipientsObject['type'] = this.selectionName;
				recipientsObject['_name'] = name;
				this.subscription.recipients.push(recipientsObject)

			} else {
				for (var i = 0; i < this.usersArray.length; i++) {
					if (this.usersArray[i].name == this.userName) {
						this.userID = this.usersArray[i]._id;
						name = this.usersArray[i].name;
					}
				}
				var recipientsObject = {};
				recipientsObject['id'] = this.userID
				recipientsObject['type'] = this.selectionName;
				recipientsObject['_name'] = name;
				this.recipientsArray.push(recipientsObject)
			}
		} else {
			if (!this.subcriptionForm.isNew) {
				var recipientsObject = {};
				for (var i = 0; i < this.groupsArray.length; i++) {

					if (this.groupsArray[i].name == this.groupName) {
						this.userID = this.groupsArray[i]._id;
						name = this.groupsArray[i].name;
					}
				}
				recipientsObject['id'] = this.userID;
				recipientsObject['type'] = this.selectionName;
				recipientsObject['_name'] = name;
				this.subscription.recipients.push(recipientsObject)

			} else {
				for (var i = 0; i < this.groupsArray.length; i++) {
					if (this.groupsArray[i].name == this.groupName) {
						this.userID = this.groupsArray[i]._id;
						name = this.groupsArray[i].name;
					}
				}
				var recipientsObject = {};
				recipientsObject['id'] = this.userID
				recipientsObject['type'] = this.selectionName;
				recipientsObject['_name'] = name;
				this.recipientsArray.push(recipientsObject)
			}

		}
	}
	getTypeahead(e: any) {
		if (e.target.value.length >= 3) {

			this.searchEvents(e.target.value).subscribe(_e => {
				this.eventTypeahead = _e
				if (this.eventTypeahead.length == 0) {
					this.show = true;
				} else {
					this.eventTypeahead = _e
					this.show = false;
				}
			}, error => {
				this.errorShow = true;
				switch (error.status) {
					case 400:
						this.errorMessage = error.error.message;
						break;
					case 500:
						this.errorMessage = "Server Error";
						break;
					case 0:
						this.errorMessage = "Unable to create subscritpion";
						break;
					case 404:
						this.errorMessage = "Unable to create subscription";
						break;
				}
			});
		}
	}
	getEventList() {
		return this.http.get(this.URL_Event + '/');
	}
	getEventNameTypeahead(index) {
		this.subcriptionForm._eventName = this.eventTypeahead[index].name;
		this.eventTypeahead = [];
	}
	clear() {
		this.subcriptionForm._eventName = ''
		this.eventTypeahead = [];
		this.show = false
	}
	subscriptionOperation() {

		if (this.subcriptionForm.isNew) {
			this.getEventList().subscribe(_e => {
				this.eventArray.push(_e);
		
				for (var i = 0; i < this.eventArray[0].length; i++) {
					if (this.eventArray[0][i].name == this.subcriptionForm._eventName) {
						this.eventId = this.eventArray[0][i]._id;
					}
				}
				this.subscritpionObject = {
					"eventID": this.eventId,
					"name": this.subcriptionForm.name,
					"recipients": this.recipientsArray
				}
				this.http.post(this.URL, this.subscritpionObject)
					.subscribe(_d => {
						if (_d) {
							this.sucessShow = true;
							this.successMessage = "Subscription Saved Sucessfully";
							this.addEditModal.dismiss();
							this.get(0, null);
						}
					}, error => {
						this.errorShow = true;
						switch (error.status) {
							case 400:
								this.errorMessage = error.error.message;
								break;
							case 500:
								this.errorMessage = "Server Error";
								break;
							case 0:
								this.errorMessage = "Unable to create subscritpion";
								break;
							case 404:
								this.errorMessage = "Unable to create subscription";
								break;
						}
					})
			})
		} else {
			this.getEventList().subscribe(_e => {
				this.eventArray.push(_e);
				for (var i = 0; i < this.eventArray[0].length; i++) {
					if (this.eventArray[0][i].name == this.subcriptionForm._eventName) {
						this.eventId = this.eventArray[0][i]._id;
					}
				}
				this.subscritpionObject = {
					"eventID": this.eventId,
					"name": this.subcriptionForm.name,
					"recipients": this.subscription.recipients
				}
				this.http.put(this.URL + "/" + this.subscription._id, this.subscritpionObject)
					.subscribe(_d => {
						if (_d) {
							this.sucessShow = true;
							this.successMessage = "Subscription Saved Sucessfully";
							this.addEditModal.dismiss();
							this.get(0, null);
						}

					}, error => {
						this.errorShow = true;
						switch (error.status) {
							case 400:
								this.errorMessage = error.error.message;
								break;
							case 500:
								this.errorMessage = "Server Error";
								break;
							case 0:
								this.errorMessage = "Unable to create subscritpion";
								break;
							case 404:
								this.errorMessage = "Unable to create subscription";
								break;
						}
					})
			})
		}
	}
	removeEditrecipeints(index) {
		this.subscription.recipients.splice(index, 1);
		this.recipientsArray = this.subscription.recipients
	}
	removerecipeints(index) {
		this.recipientsArray.splice(index, 1);
		this.recipientsArray = this.recipientsArray
	}

}
